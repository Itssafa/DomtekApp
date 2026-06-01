<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Models\Bien;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class GenerateDescriptionController extends Controller
{
    private const OPTION_LABELS = [
        'garage'            => 'garage',
        'jardin'            => 'jardin',
        'piscine'           => 'piscine',
        'chauffage_central' => 'chauffage central',
        'gaz_ville'         => 'gaz de ville',
        'ascenseur'         => 'ascenseur',
        'cave'              => 'cave',
        'terrasse'          => 'terrasse',
        'balcon'            => 'balcon',
        'parking'           => 'parking',
        'climatisation'     => 'climatisation',
        'gardien'           => 'gardien',
        'interphone'        => 'interphone',
        'digicode'          => 'digicode',
    ];

    private const TYPE_LABELS = [
        'appartement'      => 'appartement',
        'maison'           => 'maison',
        'villa'            => 'villa',
        'bureau'           => 'bureau',
        'terrain'          => 'terrain',
        'studio'           => 'studio',
        'duplex'           => 'duplex',
        'local_commercial' => 'local commercial',
        'entrepot'         => 'entrepôt',
        'ferme'            => 'ferme',
        'autre'            => 'bien immobilier',
    ];

    public function __invoke(Bien $bien): JsonResponse
    {
        $user  = auth()->user();
        $orgId = $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;
        abort_if($bien->organisation_id !== $orgId, 403);

        $prompt = $this->buildPrompt($bien);

        // ── Essai 1 : Groq (Llama 3.3) ───────────────────────────────────────
        $groqKey = config('services.groq.key');
        if ($groqKey) {
            $text = $this->callGroq($groqKey, $prompt);
            if ($text !== null) {
                return response()->json(['description' => $text]);
            }
        }

        // ── Essai 2 : Gemini (fallback) ───────────────────────────────────────
        $geminiKey = config('services.gemini.key');
        if ($geminiKey) {
            $text = $this->callGemini($geminiKey, $prompt);
            if ($text !== null) {
                return response()->json(['description' => $text]);
            }
        }

        return response()->json([
            'message' => 'Le service de génération est temporairement indisponible. Réessayez dans quelques instants.',
        ], 503);
    }

    // ── Groq (OpenAI-compatible) ──────────────────────────────────────────────

    private function callGroq(string $key, string $prompt): ?string
    {
        $res = Http::withoutVerifying()
            ->timeout(20)
            ->withToken($key)
            ->post('https://api.groq.com/openai/v1/chat/completions', [
                'model'       => 'llama-3.3-70b-versatile',
                'messages'    => [['role' => 'user', 'content' => $prompt]],
                'max_tokens'  => 450,
                'temperature' => 0.75,
            ]);

        if ($res->successful()) {
            return trim(data_get($res->json(), 'choices.0.message.content', '')) ?: null;
        }

        \Log::warning('Groq error', ['status' => $res->status(), 'body' => $res->body()]);
        return null;
    }

    // ── Gemini (fallback) ─────────────────────────────────────────────────────

    private function callGemini(string $key, string $prompt): ?string
    {
        $models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

        foreach ($models as $model) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}";

            $res = Http::withoutVerifying()
                ->timeout(20)
                ->post($url, [
                    'contents'         => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => ['temperature' => 0.75, 'maxOutputTokens' => 450],
                ]);

            if ($res->successful()) {
                return trim(data_get($res->json(), 'candidates.0.content.parts.0.text', '')) ?: null;
            }

            $isExhausted = $res->status() === 429
                || $res->status() === 403
                || str_contains($res->body(), 'RESOURCE_EXHAUSTED');

            if ($isExhausted) {
                continue;
            }

            \Log::warning("Gemini error on {$model}", ['status' => $res->status()]);
            break;
        }

        return null;
    }

    // ── Construction du prompt ────────────────────────────────────────────────

    private function buildPrompt(Bien $bien): string
    {
        $type        = self::TYPE_LABELS[$bien->type_bien] ?? $bien->type_bien;
        $transaction = $bien->type_transaction === 'vente' ? 'à vendre' : 'à louer';

        $details = [];
        if ($bien->superficie)     $details[] = "{$bien->superficie} m²";
        if ($bien->nb_pieces)      $details[] = "{$bien->nb_pieces} pièce(s)";
        if ($bien->nb_chambres)    $details[] = "{$bien->nb_chambres} chambre(s)";
        if ($bien->nb_salles_bain) $details[] = "{$bien->nb_salles_bain} salle(s) de bain";
        if ($bien->etage !== null) $details[] = $bien->etage === 0 ? 'rez-de-chaussée' : "étage {$bien->etage}";

        $options = collect($bien->options ?? [])
            ->map(fn($o) => self::OPTION_LABELS[$o] ?? $o)
            ->filter()->join(', ');

        $localisation = collect([$bien->adresse, $bien->ville])->filter()->join(', ');

        $parts = [
            "Rédige une description marketing professionnelle en français pour une annonce immobilière.",
            "Type de bien : {$type} {$transaction}.",
        ];
        if (!empty($details)) $parts[] = "Caractéristiques : " . implode(', ', $details) . ".";
        if ($options)         $parts[] = "Équipements : {$options}.";
        if ($localisation)    $parts[] = "Localisation : {$localisation}.";
        if ($bien->type_location === 'meuble') $parts[] = "Le bien est meublé.";
        if ($bien->accepte_animaux)            $parts[] = "Animaux acceptés.";
        $parts[] = "Rédige uniquement le corps de la description (3 à 5 phrases). Pas de titre, pas de liste. Ton professionnel et accrocheur.";

        return implode(' ', $parts);
    }
}
