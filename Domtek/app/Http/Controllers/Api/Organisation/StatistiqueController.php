<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Models\Bien;
use App\Models\Prospect;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class StatistiqueController extends Controller
{
    private function orgId(): int
    {
        return auth()->user()->organisation->id;
    }

    /**
     * Taux d'occupation des biens sur les 12 derniers mois.
     * Un bien est considéré "occupé" s'il a au moins un contrat actif
     * (location ou vente) dont la date_debut est <= fin du mois considéré.
     */
    public function biens(): JsonResponse
    {
        $orgId  = $this->orgId();
        $points = [];

        for ($i = 11; $i >= 0; $i--) {
            $debut = Carbon::now()->startOfMonth()->subMonths($i);
            $fin   = $debut->copy()->endOfMonth();

            $total = Bien::where('organisation_id', $orgId)
                ->where('created_at', '<=', $fin)
                ->count();

            $occupes = $total > 0
                ? Bien::where('organisation_id', $orgId)
                    ->where('created_at', '<=', $fin)
                    ->whereHas('contrats', fn ($q) =>
                        $q->where('date_debut', '<=', $fin)
                          ->where('statut', 'actif')
                    )
                    ->count()
                : 0;

            $points[] = [
                'mois_key' => $debut->format('Y-m'),
                'total'    => $total,
                'occupes'  => $occupes,
                'taux'     => $total > 0 ? round($occupes / $total * 100, 1) : 0,
            ];
        }

        return response()->json(['data' => $points]);
    }

    /**
     * Taux de conversion prospects → clients sur les 12 derniers mois.
     * Un prospect est "converti" si son client_id n'est pas null
     * et que le client associé a été créé avant ou pendant le mois.
     */
    public function prospects(): JsonResponse
    {
        $orgId  = $this->orgId();
        $points = [];

        for ($i = 11; $i >= 0; $i--) {
            $debut = Carbon::now()->startOfMonth()->subMonths($i);
            $fin   = $debut->copy()->endOfMonth();

            $total = Prospect::where('organisation_id', $orgId)
                ->where('created_at', '<=', $fin)
                ->count();

            $convertis = $total > 0
                ? Prospect::where('organisation_id', $orgId)
                    ->where('created_at', '<=', $fin)
                    ->whereNotNull('client_id')
                    ->whereHas('client', fn ($q) => $q->where('created_at', '<=', $fin))
                    ->count()
                : 0;

            $points[] = [
                'mois_key'  => $debut->format('Y-m'),
                'total'     => $total,
                'convertis' => $convertis,
                'taux'      => $total > 0 ? round($convertis / $total * 100, 1) : 0,
            ];
        }

        return response()->json(['data' => $points]);
    }
}
