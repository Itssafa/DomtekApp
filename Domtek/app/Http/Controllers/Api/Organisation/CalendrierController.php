<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Prospect;
use App\Models\Visite;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CalendrierController extends Controller
{
    private function orgId(): int
    {
        $user = auth()->user();
        return $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;
    }

    public function index(Request $request): JsonResponse
    {
        $orgId = $this->orgId();
        $user  = auth()->user();

        /* Mois demandé (ex: "2026-04"), par défaut le mois courant */
        $mois = $request->input('mois', now()->format('Y-m'));
        try {
            $debut = Carbon::createFromFormat('Y-m', $mois)->startOfMonth();
        } catch (\Throwable) {
            $debut = now()->startOfMonth();
        }
        $fin        = $debut->copy()->endOfMonth();
        $anneeMois  = $debut->month;
        $anneeVue   = $debut->year;

        /* ── Visites ── */
        $visiteQuery = Visite::where('organisation_id', $orgId)
            ->whereBetween('date_visite', [$debut, $fin])
            ->whereIn('statut', ['planifiee', 'effectuee'])
            ->with(['prospect', 'bien']);

        if ($user->isEmploye()) {
            $visiteQuery->where('employe_id', $user->employe->id);
        }

        $visites = $visiteQuery->get()->map(fn ($v) => [
            'id'           => $v->id,
            'type'         => 'visite',
            'date'         => $v->date_visite?->toDateString(),
            'heure'        => $v->date_visite?->format('H:i'),
            'statut'       => $v->statut,
            'prospect_nom' => $v->prospect?->nom_complet ?? '—',
            'bien'         => $v->bien?->designation ?? '—',
        ]);

        /* ── Quittances ── */
        $quittances = DB::table('location_quittances as q')
            ->join('locations as l', 'l.id', '=', 'q.location_id')
            ->where('l.organisation_id', $orgId)
            ->whereBetween('q.date_echeance', [$debut->toDateString(), $fin->toDateString()])
            ->whereIn('q.statut', ['prevu', 'impaye', 'partiel', 'paye', 'paye_en_retard'])
            ->select('q.id', 'q.periode', 'q.date_echeance', 'q.montant', 'q.statut',
                     'l.id as location_id', 'l.locataire_nom')
            ->get()
            ->map(fn ($q) => [
                'id'            => $q->id,
                'type'          => 'quittance',
                'date'          => $q->date_echeance,
                'statut'        => $q->statut,
                'periode'       => $q->periode,
                'montant'       => (float) $q->montant,
                'locataire_nom' => $q->locataire_nom,
                'location_id'   => $q->location_id,
            ]);

        /* ── Anniversaires clients ── */
        $clientsAnniv = Client::where('organisation_id', $orgId)
            ->whereNotNull('date_naissance')
            ->whereRaw('MONTH(date_naissance) = ?', [$anneeMois])
            ->get(['id', 'nom', 'prenom', 'date_naissance'])
            ->map(function ($c) use ($anneeVue) {
                $naissance = Carbon::parse($c->date_naissance);
                $age       = $anneeVue - $naissance->year;
                $dateCalendrier = sprintf('%04d-%02d-%02d', $anneeVue, $naissance->month, $naissance->day);
                return [
                    'id'       => $c->id,
                    'type'     => 'anniversaire',
                    'cible'    => 'client',
                    'date'     => $dateCalendrier,
                    'nom'      => trim("{$c->prenom} {$c->nom}"),
                    'age'      => $age,
                ];
            });

        /* ── Anniversaires prospects ── */
        $prospectsAnniv = Prospect::where('organisation_id', $orgId)
            ->whereNotNull('date_naissance')
            ->whereRaw('MONTH(date_naissance) = ?', [$anneeMois])
            ->get(['id', 'nom', 'prenom', 'date_naissance'])
            ->map(function ($p) use ($anneeVue) {
                $naissance = Carbon::parse($p->date_naissance);
                $age       = $anneeVue - $naissance->year;
                $dateCalendrier = sprintf('%04d-%02d-%02d', $anneeVue, $naissance->month, $naissance->day);
                return [
                    'id'       => $p->id,
                    'type'     => 'anniversaire',
                    'cible'    => 'prospect',
                    'date'     => $dateCalendrier,
                    'nom'      => trim("{$p->prenom} {$p->nom}"),
                    'age'      => $age,
                ];
            });

        return response()->json([
            'mois'          => $debut->format('Y-m'),
            'visites'       => $visites,
            'quittances'    => $quittances,
            'anniversaires' => [...$clientsAnniv, ...$prospectsAnniv],
        ]);
    }
}
