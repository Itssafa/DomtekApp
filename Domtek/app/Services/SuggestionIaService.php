<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\Prospect;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Suggestions de biens pour un prospect, décidées par l'IA.
 *
 * L'IA reçoit le profil du prospect et tous les biens disponibles de l'agence.
 * C'est elle qui juge, pour chaque bien, si le prospect peut le payer et s'il
 * correspond à sa vie (métier, famille, animaux, ville…), qui attribue le
 * score et qui rédige la raison. Aucun barème n'est appliqué côté serveur :
 * le code se borne à ne lui présenter que des biens réellement disponibles.
 */
class SuggestionIaService
{
    /** Au-delà, la liste ne tient plus dans la requête : on présente les plus récents. */
    private const BIENS_MAX = 60;

    /** Un bien noté en dessous n'est pas proposé. */
    private const SCORE_MIN = 50;

    public function __construct(private ProfilProspectService $profil) {}

    /**
     * @return list<array{bien: Bien, score: int, raison: string}>|null
     *   null si l'IA n'a pas pu répondre (clé absente, panne, réponse illisible).
     */
    public function suggerer(Prospect $prospect, int $nombre = 5): ?array
    {
        $cle = config('services.groq.key');
        if (! $cle) {
            return null;
        }

        $interetIds = array_values(array_filter((array) ($prospect->biens_interet ?? [])));

        $biens = Bien::where('organisation_id', $prospect->organisation_id)
            ->where('statut', 'disponible')
            ->whereDoesntHave('contrats', fn ($q) => $q->where('statut', 'actif'))
            ->when($interetIds, fn ($q) => $q->whereNotIn('id', $interetIds))
            ->latest()
            ->limit(self::BIENS_MAX)
            ->get();

        if ($biens->isEmpty()) {
            return [];
        }

        $interet = $interetIds
            ? Bien::whereIn('id', $interetIds)->get()->map(fn (Bien $b) => $this->profil->bienPourIa($b))->all()
            : [];

        $reponse = $this->interroger($cle, $this->prompt($prospect, $biens->all(), $interet, $nombre));
        if ($reponse === null) {
            return null;
        }

        $parId = $biens->keyBy('id');

        return collect($reponse)
            ->filter(fn ($i) => isset($i['id'], $i['score']) && $parId->has((int) $i['id']))
            ->map(fn ($i) => [
                'bien'   => $parId[(int) $i['id']],
                'score'  => min(100, max(0, (int) $i['score'])),
                'raison' => mb_substr(trim((string) ($i['raison'] ?? '')), 0, 200),
            ])
            ->filter(fn ($s) => $s['score'] >= self::SCORE_MIN)
            ->sortByDesc('score')
            ->take($nombre)
            ->values()
            ->all();
    }

    /** @param list<Bien> $biens */
    private function prompt(Prospect $prospect, array $biens, array $interet, int $nombre): string
    {
        $liste = array_map(fn (Bien $b) => $this->profil->bienPourIa($b), $biens);

        return "Tu es un conseiller immobilier tunisien expérimenté. Tu dois choisir, parmi les biens "
            . "disponibles d'une agence, ceux qui conviennent vraiment à un prospect.\n\n"
            . "PROSPECT\n" . $this->profil->descriptionPourIa($prospect, $interet) . "\n\n"
            . "BIENS DISPONIBLES\n" . json_encode($liste, JSON_UNESCAPED_UNICODE) . "\n\n"
            . "MÉTHODE\n"
            . "1. Détermine d'abord ce que ce prospect cherche le plus probablement, d'après son métier et sa "
            . "famille. Un médecin, un dentiste, un avocat, un notaire, un architecte ou une profession libérale "
            . "cherche avant tout un cabinet ou un bureau ; un commerçant un local commercial (ou un entrepôt) ; "
            . "un agriculteur un terrain ou une ferme ; un étudiant un studio ou un S+1 ; les autres un logement.\n"
            . "2. Le bien qui répond à ce besoin principal doit avoir le meilleur score, au-dessus de tout autre "
            . "bien. Un logement ordinaire proposé à un professionnel qui cherche un local ne dépasse pas 60.\n"
            . "3. Taille du logement selon la famille : un S+3 ou plus, une maison ou une villa convient à une "
            . "famille avec enfants (Mme = femme mariée, ou M., avec enfants). Sans enfants, ou pour une Mlle "
            . "seule, un tel logement reçoit moins de 50. Un studio ou un S+1 ne convient pas à une famille avec "
            . "enfants (moins de 50). S'il a des animaux, le logement doit les accepter.\n"
            . "4. Ses moyens : sers-toi des repères de loyer supportable et de prix finançable à crédit donnés "
            . "dans son profil. Un bien dans ces repères est payable, y compris un achat financé à crédit. "
            . "Un bien nettement au-dessus reçoit moins de 50, même s'il est adapté à son métier.\n"
            . "5. Un bien sans usage pour lui (un entrepôt ou un terrain pour un salarié ou un étudiant, un "
            . "cabinet pour un étudiant…) reçoit moins de 30.\n"
            . "6. À égalité, préfère la proximité avec sa ville et celles des biens qui l'intéressent "
            . "(ex. Tunis↔Ariana très proche, Sousse↔Monastir proche, Tunis↔Sfax éloigné) et ses priorités.\n\n"
            . "Attribue à chaque bien un score de 0 à 100 et une raison en français, une phrase de 20 mots au "
            . "plus, cohérente avec le score, qui dit pourquoi il convient ou non à CE prospect. "
            . "Ne retiens au plus que les {$nombre} meilleurs biens.\n"
            . "Réponds UNIQUEMENT avec ce JSON, sans texte autour :\n"
            . "{\"suggestions\":[{\"id\":1,\"score\":85,\"raison\":\"...\"}]}";
    }

    /** @return list<array<string, mixed>>|null */
    private function interroger(string $cle, string $prompt): ?array
    {
        $corps = [
            'model'           => config('services.groq.model_suggestions'),
            'messages'        => [['role' => 'user', 'content' => $prompt]],
            'max_tokens'      => 4000,
            'temperature'     => 0.2,
            'response_format' => ['type' => 'json_object'],
        ];
        if ($effort = config('services.groq.suggestions_reasoning')) {
            $corps['reasoning_effort'] = $effort;
        }

        // Deux tentatives : le compte gratuit de Groq limite les tokens par
        // minute (429). Il indique le délai à respecter ; s'il est court, on
        // patiente puis on réessaie au lieu d'échouer.
        for ($tentative = 1; $tentative <= 2; $tentative++) {
            try {
                $res = Http::withoutVerifying()
                    ->timeout(60)
                    ->withToken($cle)
                    ->post('https://api.groq.com/openai/v1/chat/completions', $corps);
            } catch (\Throwable $e) {
                Log::warning('Suggestions IA : service injoignable', ['erreur' => $e->getMessage()]);
                return null;
            }

            $attente = $res->status() === 429 ? $this->delaiDemande($res->body()) : null;
            if ($attente === null || $attente > 20 || $tentative === 2) {
                break;
            }
            usleep((int) (($attente + 0.5) * 1_000_000));
        }

        if (! $res->successful()) {
            Log::warning('Suggestions IA : erreur du service', ['status' => $res->status(), 'body' => mb_substr($res->body(), 0, 500)]);
            return null;
        }

        $contenu = trim((string) data_get($res->json(), 'choices.0.message.content', ''));
        $json    = json_decode($contenu, true);

        if (! is_array($json) || ! isset($json['suggestions']) || ! is_array($json['suggestions'])) {
            Log::warning('Suggestions IA : réponse illisible', ['contenu' => mb_substr($contenu, 0, 500)]);
            return null;
        }

        return $json['suggestions'];
    }

    /** Délai demandé par Groq dans un refus 429 (« try again in 1.5s » ou « 990ms »). */
    private function delaiDemande(string $corps): ?float
    {
        if (preg_match('/try again in ([\d.]+)(ms|s)/', $corps, $m)) {
            return $m[2] === 'ms' ? (float) $m[1] / 1000 : (float) $m[1];
        }

        return null;
    }
}
