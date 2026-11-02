<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Models\Bien;
use App\Models\Prospect;
use App\Services\ProfilProspectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

/**
 * Suggestions de biens pour un prospect, analysées par l'IA.
 *
 * 1. Règles (ProfilProspectService) : on écarte ce que le prospect ne peut pas
 *    payer, puis on pré-classe par cohérence avec son profil (profession,
 *    enfants, civilité, animaux) et ses biens d'intérêt.
 * 2. IA (Groq) : sur les 15 meilleurs, elle juge l'adéquation globale et
 *    rédige pour chacun une raison courte. Si elle est indisponible, les
 *    règles suffisent et fournissent elles-mêmes l'explication.
 */
class ProspectSuggestionsController extends Controller
{
    public function __construct(private ProfilProspectService $profil) {}

    public function __invoke(Prospect $prospect): JsonResponse
    {
        $user  = auth()->user();
        $orgId = $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;
        abort_if($prospect->organisation_id !== $orgId, 403);

        // 1. Référence : les biens qui intéressent déjà le prospect
        $refIds   = array_values(array_filter((array) ($prospect->biens_interet ?? [])));
        $refBiens = $refIds ? Bien::whereIn('id', $refIds)->get() : collect();

        $refPrix        = $refBiens->avg('prix');
        $refTypes       = $refBiens->pluck('type_bien')->filter()->unique()->values()->toArray();
        $refTransaction = $refBiens->first()?->type_transaction;
        $refVilles      = $refBiens->pluck('ville')->filter()->unique()->values()->toArray();

        // 2. Biens disponibles de l'agence, sans contrat actif
        $query = Bien::where('organisation_id', $orgId)
            ->where('statut', 'disponible')
            ->whereDoesntHave('contrats', fn ($q) => $q->where('statut', 'actif'));

        if ($refIds)         $query->whereNotIn('id', $refIds);
        if ($refTransaction) $query->where('type_transaction', $refTransaction);

        $candidates = $query->get([
            'id', 'designation', 'type_bien', 'type_transaction', 'type_location',
            'prix', 'ville', 'superficie', 'nb_pieces', 'nb_chambres', 'options',
            'accepte_animaux',
        ])
            // Hors de ses moyens : jamais proposé, quelle que soit la cohérence.
            ->reject(fn (Bien $b) => $this->profil->estSolvable($b, $prospect) === false);

        if ($candidates->isEmpty()) {
            return response()->json(['suggestions' => []]);
        }

        // 3. Pré-classement par les règles → 15 meilleurs
        $prescored = $candidates->map(function (Bien $b) use ($refPrix, $refTypes, $prospect) {
            $coherence = $this->profil->coherence($b, $prospect);
            $score     = 40 + $coherence['points'];

            if ($refPrix && $b->prix) {
                $ratio = abs((float) $b->prix - $refPrix) / $refPrix;
                if ($ratio <= 0.15)     $score += 15;
                elseif ($ratio <= 0.25) $score += 10;
                elseif ($ratio <= 0.35) $score += 5;
            }
            if ($refTypes && in_array($b->type_bien, $refTypes, true)) $score += 10;
            if ($this->profil->estSolvable($b, $prospect) === true)    $score += 10;

            return [
                'bien'      => $b,
                'score'     => max(0, min(100, $score)),
                'coherence' => $coherence,
                'raison'    => null,
            ];
        })->sortByDesc('score')->take(15)->values();

        // 4. Analyse IA : score final et raison rédigée
        $groqKey = config('services.groq.key');
        if ($groqKey) {
            $avis = $this->callGroq($groqKey, $prospect, $prescored, $refVilles);
            if ($avis) {
                $prescored = $prescored->map(function ($item) use ($avis) {
                    $a = $avis[$item['bien']->id] ?? null;
                    if ($a) {
                        $item['score']  = $a['score'];
                        $item['raison'] = $a['raison'];
                    }
                    return $item;
                })->sortByDesc('score')->values();
            }
        }

        $suggestions = $prescored
            // Un bien jugé incohérent (cabinet pour un étudiant…) n'est pas proposé.
            ->filter(fn ($item) => $item['score'] >= 30)
            ->take(5)
            ->map(fn ($item) => [
                'id'               => $item['bien']->id,
                'designation'      => $item['bien']->designation,
                'type_bien'        => $item['bien']->type_bien,
                'type_transaction' => $item['bien']->type_transaction,
                'prix'             => $item['bien']->prix,
                'ville'            => $item['bien']->ville,
                'superficie'       => $item['bien']->superficie,
                'nb_pieces'        => $item['bien']->nb_pieces,
                'score'            => $item['score'],
                'raison'           => $item['raison'] ?? $this->raisonParRegles($item['coherence']),
                'alertes'          => $item['coherence']['alertes'],
            ])->values();

        return response()->json(['suggestions' => $suggestions]);
    }

    /** Explication de repli, quand l'IA n'a pas répondu. */
    private function raisonParRegles(array $coherence): ?string
    {
        return $coherence['raisons'] ? implode(' · ', $coherence['raisons']) : null;
    }

    /**
     * @param  Collection<int, array{bien: Bien}>  $items
     * @return array<int, array{score: int, raison: ?string}>
     */
    private function callGroq(string $key, Prospect $prospect, Collection $items, array $refVilles): array
    {
        $biensList = $items->map(function ($item) {
            /** @var Bien $b */
            $b = $item['bien'];
            return [
                'id'          => $b->id,
                'type'        => $b->type_bien,
                'transaction' => $b->type_transaction === 'loyer' ? 'location' : 'vente',
                'prix'        => (float) $b->prix . ($b->type_transaction === 'loyer' ? ' DT/mois' : ' DT'),
                'meuble'      => $b->type_location === 'meuble',
                'ville'       => $b->ville,
                'superficie'  => $b->superficie,
                'chambres'    => $b->nb_chambres,
                'pieces'      => $b->nb_pieces,
                'animaux_acceptes' => (bool) $b->accepte_animaux,
            ];
        })->values()->toArray();

        $villes = $refVilles ? implode(', ', $refVilles) : 'aucune en particulier';

        $prompt = "Tu es un conseiller immobilier tunisien expérimenté.\n\n"
            . "Profil du prospect :\n" . $this->profil->descriptionPourIa($prospect) . "\n"
            . "- Villes des biens qui l'intéressent déjà : {$villes}\n\n"
            . "Biens disponibles (tous dans son budget) :\n" . json_encode($biensList, JSON_UNESCAPED_UNICODE) . "\n\n"
            . "Attribue à chaque bien un score d'adéquation de 0 à 100 en jugeant, dans cet ordre :\n"
            . "1. Cohérence avec sa vie et son métier. Exemples : un cabinet ou bureau pour un médecin, "
            . "un avocat ou une profession libérale ; un terrain ou une ferme pour un agriculteur ; un local "
            . "commercial pour un commerçant ; un studio ou un S+1 pour un étudiant ; un S+3 ou plus (ou une "
            . "maison, une villa) pour une famille — Mme (femme mariée) ou M. avec enfants —, pas pour une "
            . "Mlle seule ou une personne sans enfants ; un logement acceptant les animaux s'il en a. "
            . "Un bien sans rapport avec son profil (ex. un entrepôt pour un étudiant) doit avoir moins de 30.\n"
            . "2. Ses moyens : un loyer au plus égal à son loyer maximal, un prix au plus égal à son prix "
            . "d'achat maximal ; mieux vaut un bien nettement en dessous de la limite.\n"
            . "3. La localisation : proximité avec sa ville et ses villes d'intérêt "
            . "(ex. Tunis↔Ariana très proche, Sousse↔Monastir proche, Tunis↔Sfax éloigné).\n\n"
            . "Pour chaque bien, donne aussi une raison en français, une phrase de 15 mots au plus, "
            . "qui dit pourquoi il convient ou non à ce prospect.\n"
            . "Réponds UNIQUEMENT avec ce JSON, sans texte autour :\n"
            . "{\"suggestions\":[{\"id\":1,\"score\":80,\"raison\":\"...\"}]}";

        // Cet appel n'est qu'un affinage : la panne du service ne doit jamais
        // empêcher d'afficher les suggestions déjà calculées par les règles.
        try {
            $res = Http::withoutVerifying()
                ->timeout(25)
                ->withToken($key)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model'           => config('services.groq.model_json'),
                    'messages'        => [['role' => 'user', 'content' => $prompt]],
                    'max_tokens'      => 1500,
                    'temperature'     => 0.1,
                    'response_format' => ['type' => 'json_object'],
                ]);
        } catch (\Throwable $e) {
            \Log::warning('Groq suggestions injoignable', ['erreur' => $e->getMessage()]);
            return [];
        }

        if (! $res->successful()) {
            \Log::warning('Groq suggestions error', ['status' => $res->status(), 'body' => $res->body()]);
            return [];
        }

        $content = trim(data_get($res->json(), 'choices.0.message.content', ''));
        $items   = json_decode($content, true)['suggestions'] ?? [];

        return collect($items)
            ->filter(fn ($i) => isset($i['id'], $i['score']))
            ->mapWithKeys(fn ($i) => [(int) $i['id'] => [
                'score'  => min(100, max(0, (int) $i['score'])),
                'raison' => isset($i['raison']) ? mb_substr(trim((string) $i['raison']), 0, 160) : null,
            ]])
            ->toArray();
    }
}
