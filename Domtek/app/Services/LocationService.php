<?php

namespace App\Services;

use App\Models\Location;
use App\Models\Quittance;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class LocationService
{
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        $query = Location::where('organisation_id', $orgId)
            ->with(['bien']);

        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (!empty($filters['bien_id'])) {
            $query->where('bien_id', $filters['bien_id']);
        }
        if (!empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($term) {
                $q->where('designation', 'like', $term)
                  ->orWhere('locataire_nom', 'like', $term)
                  ->orWhereHas('bien', fn($b) => $b->where('designation', 'like', $term));
            });
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);
        return $query->latest()->paginate($perPage);
    }

    public function store(int $orgId, array $data): Location
    {
        $data = $this->computeFinancials($data);
        $data['organisation_id'] = $orgId;

        $location = Location::create($data);
        $this->syncQuittances($location);

        return $location->load(['bien', 'quittances']);
    }

    public function update(Location $location, array $data): Location
    {
        $data = $this->computeFinancials($data);
        $location->update($data);
        $this->syncQuittances($location->fresh());

        return $location->load(['bien', 'quittances']);
    }

    public function uploadAssurance(Location $location, UploadedFile $file, int $orgId): Location
    {
        if ($location->assurance) {
            Storage::delete($location->assurance);
        }
        $path = $file->store("locations/{$orgId}/assurance", 'public');
        $location->update(['assurance' => $path]);
        return $location;
    }

    public function destroy(Location $location): void
    {
        if ($location->assurance) Storage::disk('public')->delete($location->assurance);
        $location->delete();
    }

    /**
     * Record a payment on a quittance and recompute its statut.
     */
    public function enregistrerPaiement(Quittance $quittance, float $montantPaye, ?string $datePaiement): Quittance
    {
        $quittance->montant_paye   = $montantPaye;
        $quittance->date_paiement  = $datePaiement ?? Carbon::today()->format('Y-m-d');
        $quittance->statut         = $quittance->computeStatut();
        $quittance->save();

        return $quittance;
    }

    /**
     * Auto-fill montant_ttc and montant_paiement from raw inputs.
     */
    private function computeFinancials(array $data): array
    {
        $ht      = (float) ($data['montant_ht'] ?? 0);
        $tva     = (float) ($data['tva'] ?? 0);
        $frais   = (float) ($data['frais_syndic'] ?? 0);
        $retenue = (float) ($data['retenue_source'] ?? 0);

        $data['montant_ttc']      = Location::calculTtc($ht, $tva);
        $data['montant_paiement'] = Location::calculPaiement($data['montant_ttc'], $frais, $retenue, $ht);

        return $data;
    }

    /**
     * Ensure quittances exist for every period from premiere_echeance to today.
     * Already-paid quittances are never modified.
     */
    private function syncQuittances(Location $location): void
    {
        $periodes = $location->genererPeriodes();
        $step     = Location::periodiciteMonths($location->periodicite);
        $montant  = (float) $location->montant_paiement;

        foreach ($periodes as $periode) {
            $echeance = Carbon::createFromFormat('Y-m', $periode)
                ->setDay(min($location->jour_paiement, 28))
                ->format('Y-m-d');

            $quittance = Quittance::firstOrNew([
                'location_id' => $location->id,
                'periode'     => $periode,
            ]);

            if (!$quittance->exists) {
                $quittance->date_echeance = $echeance;
                $quittance->montant       = $montant;
                $quittance->statut        = Carbon::today()->gt($echeance) ? 'impaye' : 'prevu';
                $quittance->save();
            }
        }
    }
}
