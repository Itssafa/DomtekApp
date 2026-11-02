<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Models\Prospect;
use App\Services\SuggestionIaService;
use Illuminate\Http\JsonResponse;

/**
 * Bouton « Analyser » de la fiche prospect : suggestions décidées par l'IA.
 */
class ProspectSuggestionsController extends Controller
{
    public function __construct(private SuggestionIaService $ia) {}

    public function __invoke(Prospect $prospect): JsonResponse
    {
        $user  = auth()->user();
        $orgId = $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;
        abort_if($prospect->organisation_id !== $orgId, 403);

        $suggestions = $this->ia->suggerer($prospect);

        if ($suggestions === null) {
            return response()->json([
                'message' => "L'analyse IA est momentanément indisponible. Réessayez dans un instant.",
            ], 503);
        }

        return response()->json([
            'suggestions' => array_map(fn ($s) => [
                'id'               => $s['bien']->id,
                'designation'      => $s['bien']->designation,
                'type_bien'        => $s['bien']->type_bien,
                'type_transaction' => $s['bien']->type_transaction,
                'prix'             => $s['bien']->prix,
                'ville'            => $s['bien']->ville,
                'superficie'       => $s['bien']->superficie,
                'nb_pieces'        => $s['bien']->nb_pieces,
                'score'            => $s['score'],
                'raison'           => $s['raison'],
            ], $suggestions),
        ]);
    }
}
