<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Models\ProspectSuggestion;
use Illuminate\Http\JsonResponse;

class DashboardSuggestionsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $user  = auth()->user();
        $orgId = $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;

        $rows = ProspectSuggestion::with([
            'prospect:id,nom,prenom,ville',
            'bien:id,designation,type_bien,type_transaction,prix,ville,superficie',
        ])
            ->where('organisation_id', $orgId)
            ->orderByDesc('score')
            ->limit(15)
            ->get();

        $lastUpdate = ProspectSuggestion::where('organisation_id', $orgId)
            ->max('updated_at');

        $suggestions = $rows->map(fn($row) => [
            'score'   => $row->score,
            'prospect' => [
                'id'   => $row->prospect->id,
                'nom'  => $row->prospect->nom . ' ' . $row->prospect->prenom,
                'ville'=> $row->prospect->ville,
            ],
            'bien' => [
                'id'               => $row->bien->id,
                'designation'      => $row->bien->designation,
                'type_bien'        => $row->bien->type_bien,
                'type_transaction' => $row->bien->type_transaction,
                'prix'             => $row->bien->prix,
                'ville'            => $row->bien->ville,
                'superficie'       => $row->bien->superficie,
            ],
        ]);

        return response()->json([
            'suggestions'  => $suggestions,
            'last_updated' => $lastUpdate,
        ]);
    }
}
