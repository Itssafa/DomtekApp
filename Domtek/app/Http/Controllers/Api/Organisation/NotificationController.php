<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Prospect;
use App\Models\Visite;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();

        if ($user->isEmploye()) {
            return $this->notificationsEmploye($user);
        }

        return $this->notificationsOrganisation($user->organisation->id);
    }

    private function notificationsOrganisation(int $orgId): JsonResponse
    {
        $today    = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        $clientsAnniv = Client::where('organisation_id', $orgId)
            ->whereNotNull('date_naissance')
            ->whereRaw('MONTH(date_naissance) = ?', [$today->month])
            ->whereRaw('DAY(date_naissance) = ?',   [$today->day])
            ->get(['id', 'nom_complet', 'date_naissance'])
            ->map(fn ($c) => [
                'type'    => 'anniversaire',
                'cible'   => 'client',
                'id'      => $c->id,
                'nom'     => $c->nom_complet,
                'age'     => $today->year - Carbon::parse($c->date_naissance)->year,
                'message' => "Anniversaire de {$c->nom_complet} (client)",
            ]);

        $prospectsAnniv = Prospect::where('organisation_id', $orgId)
            ->whereNotNull('date_naissance')
            ->whereRaw('MONTH(date_naissance) = ?', [$today->month])
            ->whereRaw('DAY(date_naissance) = ?',   [$today->day])
            ->get(['id', 'nom', 'prenom', 'date_naissance'])
            ->map(fn ($p) => [
                'type'    => 'anniversaire',
                'cible'   => 'prospect',
                'id'      => $p->id,
                'nom'     => trim("{$p->prenom} {$p->nom}"),
                'age'     => $today->year - Carbon::parse($p->date_naissance)->year,
                'message' => "Anniversaire de " . trim("{$p->prenom} {$p->nom}") . " (prospect)",
            ]);

        $visiteDemain = Visite::where('organisation_id', $orgId)
            ->where('statut', 'planifiee')
            ->whereDate('date_visite', $tomorrow)
            ->with(['prospect:id,nom,prenom', 'bien:id,designation,adresse', 'employe:id,nom,prenom'])
            ->get()
            ->map(fn ($v) => [
                'type'        => 'visite',
                'id'          => $v->id,
                'nom'         => $v->prospect ? trim("{$v->prospect->prenom} {$v->prospect->nom}") : '—',
                'bien'        => $v->bien?->designation ?? $v->bien?->adresse ?? '—',
                'agent'       => $v->employe ? trim("{$v->employe->prenom} {$v->employe->nom}") : ($v->nom_agent ?? '—'),
                'date_visite' => $v->date_visite,
                'message'     => "Visite demain : " . ($v->bien?->designation ?? '—') . " avec " . ($v->prospect ? trim("{$v->prospect->prenom} {$v->prospect->nom}") : '—'),
            ]);

        return response()->json([
            'data' => [...$clientsAnniv, ...$prospectsAnniv, ...$visiteDemain],
        ]);
    }

    private function notificationsEmploye($user): JsonResponse
    {
        $employe = $user->employe;
        $now     = Carbon::now();

        $visites = Visite::where('employe_id', $employe->id)
            ->where('statut', 'planifiee')
            ->where('date_visite', '>=', $now)
            ->with(['prospect:id,nom,prenom', 'bien:id,designation,adresse'])
            ->orderBy('date_visite')
            ->get()
            ->map(function ($v) {
                $date = Carbon::parse($v->date_visite);
                $label = $date->isToday() ? "Aujourd'hui"
                    : ($date->isTomorrow() ? 'Demain'
                    : 'Le ' . $date->format('d/m/Y'));
                return [
                    'type'        => 'visite',
                    'id'          => $v->id,
                    'nom'         => $v->prospect ? trim("{$v->prospect->prenom} {$v->prospect->nom}") : '—',
                    'bien'        => $v->bien?->designation ?? $v->bien?->adresse ?? '—',
                    'date_visite' => $v->date_visite,
                    'message'     => "{$label} : visite " . ($v->bien?->designation ?? '—')
                        . " avec " . ($v->prospect ? trim("{$v->prospect->prenom} {$v->prospect->nom}") : '—'),
                ];
            });

        return response()->json(['data' => $visites]);
    }
}
