<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Models\Bien;
use App\Models\Prospect;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class ProspectSuggestionsController extends Controller
{
    private const REVENUS_BUDGET = [
        'moins_1000'  => 80_000,
        '1000_2000'   => 150_000,
        '3000_6000'   => 300_000,
        '7000_10000'  => 500_000,
        'plus_10000'  => 800_000,
    ];

    public function __invoke(Prospect $prospect): JsonResponse
    {
        $user  = auth()->user();
        $orgId = $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;
        abort_if($prospect->organisation_id !== $orgId, 403);

        // 1. Profil de référence depuis les biens d'intérêt du prospect
        $refIds   = array_values(array_filter((array) ($prospect->biens_interet ?? [])));
        $refBiens = $refIds ? Bien::whereIn('id', $refIds)->get() : collect();

        $refPrix        = $refBiens->avg('prix');
        $refTypes       = $refBiens->pluck('type_bien')->filter()->unique()->values()->toArray();
        $refTransaction = $refBiens->first()?->type_transaction;
        $refVilles      = $refBiens->pluck('ville')->filter()->unique()->values()->toArray();

        // Fallback : budget estimé depuis les revenus mensuels
        if (!$refPrix && $prospect->revenus_mensuels) {
            $refPrix = self::REVENUS_BUDGET[$prospect->revenus_mensuels] ?? null;
        }

        // 2. Biens disponibles dans la même org, sans contrat actif
        $query = Bien::where('organisation_id', $orgId)
            ->where('statut', 'disponible')
            ->whereDoesntHave('contrats', fn($q) => $q->where('statut', 'actif'));

        if ($refIds)         $query->whereNotIn('id', $refIds);
        if ($refTransaction) $query->where('type_transaction', $refTransaction);

        $candidates = $query->get([
            'id', 'designation', 'type_bien', 'type_transaction',
            'prix', 'ville', 'superficie', 'nb_pieces', 'options',
            'accepte_animaux',
        ]);

        if ($candidates->isEmpty()) {
            return response()->json(['suggestions' => []]);
        }

        // 3. Pré-scoring rule-based (prix + type) → garder top 15
        $prescored = $candidates->map(function (Bien $b) use ($refPrix, $refTypes, $prospect) {
            $score = 0;

            if ($refPrix && $b->prix) {
                $ratio = abs((float) $b->prix - $refPrix) / $refPrix;
                if ($ratio <= 0.15)     $score += 40;
                elseif ($ratio <= 0.25) $score += 28;
                elseif ($ratio <= 0.35) $score += 15;
            }

            if ($refTypes && in_array($b->type_bien, $refTypes)) $score += 20;

            // Bonus : animaux acceptés si prospect a des animaux
            if ($b->accepte_animaux && in_array('animaux', $prospect->composition_foyer ?? [])) {
                $score += 5;
            }

            return ['bien' => $b, 'score' => $score];
        })->sortByDesc('score')->take(15)->values();

        // 4. Scoring final avec Groq (proximité géo + cohérence globale)
        $groqKey = config('services.groq.key');
        if ($groqKey) {
            $groqScores = $this->callGroq($groqKey, $prospect, $prescored->pluck('bien'), $refPrix, $refVilles);
            if ($groqScores) {
                $prescored = $prescored->map(fn($item) => [
                    'bien'  => $item['bien'],
                    'score' => $groqScores[$item['bien']->id] ?? $item['score'],
                ])->sortByDesc('score')->values();
            }
        }

        $suggestions = $prescored->take(5)->map(fn($item) => [
            'id'               => $item['bien']->id,
            'designation'      => $item['bien']->designation,
            'type_bien'        => $item['bien']->type_bien,
            'type_transaction' => $item['bien']->type_transaction,
            'prix'             => $item['bien']->prix,
            'ville'            => $item['bien']->ville,
            'superficie'       => $item['bien']->superficie,
            'nb_pieces'        => $item['bien']->nb_pieces,
            'score'            => $item['score'],
        ])->values();

        return response()->json(['suggestions' => $suggestions]);
    }

    private function callGroq(string $key, Prospect $prospect, Collection $biens, ?float $refPrix, array $refVilles): array
    {
        $biensList = $biens->map(fn(Bien $b) => [
            'id'        => $b->id,
            'type'      => $b->type_bien,
            'prix'      => (float) $b->prix,
            'ville'     => $b->ville,
            'superficie'=> $b->superficie,
            'pieces'    => $b->nb_pieces,
        ])->values()->toArray();

        $budget = $refPrix ? number_format($refPrix, 0, ',', ' ') . ' DT' : 'non précisé';
        $villes = $refVilles ? implode(', ', $refVilles) : ($prospect->ville ?? 'non précisées');

        $prompt = "Tu es un expert immobilier tunisien.\n"
            . "Profil du prospect :\n"
            . "- Ville du prospect : " . ($prospect->ville ?? 'non précisée') . "\n"
            . "- Villes d'intérêt : {$villes}\n"
            . "- Budget de référence : {$budget}\n"
            . "- Priorités : " . implode(', ', $prospect->hierarchie_besoins ?? []) . "\n\n"
            . "Biens disponibles :\n" . json_encode($biensList, JSON_UNESCAPED_UNICODE) . "\n\n"
            . "Pour chaque bien, calcule un score de compatibilité 0–100 :\n"
            . "1. Proximité géographique tunisienne (ex: Sousse↔Hammamet=80, Sousse↔Nabeul=70, Tunis↔Ariana=95, Sfax↔Tunis=30)\n"
            . "2. Prix proche du budget : ±15%=40pts, ±25%=28pts, ±35%=15pts\n"
            . "3. Cohérence globale du type et superficie\n\n"
            . "Réponds UNIQUEMENT avec ce JSON (aucun texte autour) :\n"
            . "{\"suggestions\":[{\"id\":X,\"score\":Y},...]}";

        // Cet appel n'est qu'un affinage : la panne du service ne doit jamais
        // empêcher d'afficher les suggestions déjà calculées par les règles. Sans
        // ce try/catch, une panne réseau remontait en erreur 500.
        try {
            $res = Http::withoutVerifying()
                ->timeout(20)
                ->withToken($key)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model'           => config('services.groq.model_json'),
                    'messages'        => [['role' => 'user', 'content' => $prompt]],
                    'max_tokens'      => 600,
                    'temperature'     => 0.1,
                    'response_format' => ['type' => 'json_object'],
                ]);
        } catch (\Throwable $e) {
            \Log::warning('Groq suggestions injoignable', ['erreur' => $e->getMessage()]);
            return [];
        }

        if (!$res->successful()) {
            \Log::warning('Groq suggestions error', ['status' => $res->status(), 'body' => $res->body()]);
            return [];
        }

        $content = trim(data_get($res->json(), 'choices.0.message.content', ''));
        $decoded = json_decode($content, true);
        $items   = $decoded['suggestions'] ?? [];

        return collect($items)
            ->filter(fn($i) => isset($i['id'], $i['score']))
            ->mapWithKeys(fn($i) => [(int) $i['id'] => min(100, max(0, (int) $i['score']))])
            ->toArray();
    }
}
