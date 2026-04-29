<?php

namespace App\Services;

use App\Models\EtatLieu;
use Illuminate\Pagination\LengthAwarePaginator;

class EtatLieuService
{
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        $query = EtatLieu::where('organisation_id', $orgId)
            ->with(['contrat.bien', 'contrat.clients', 'location']);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (!empty($filters['contrat_id'])) {
            $query->where('contrat_id', $filters['contrat_id']);
        }
        if (!empty($filters['location_id'])) {
            $query->where('location_id', $filters['location_id']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);
        return $query->latest('date')->paginate($perPage);
    }

    public function store(int $orgId, array $data): EtatLieu
    {
        $inventaires = $data['inventaires'] ?? [];
        unset($data['inventaires']);

        $data['organisation_id'] = $orgId;
        $etatLieu = EtatLieu::create($data);

        $this->syncInventaires($etatLieu, $inventaires);

        return $etatLieu->load(['contrat.bien', 'contrat.clients', 'location', 'inventaires']);
    }

    public function update(EtatLieu $etatLieu, array $data): EtatLieu
    {
        $inventaires = $data['inventaires'] ?? null;
        unset($data['inventaires']);

        $etatLieu->update($data);

        if ($inventaires !== null) {
            $this->syncInventaires($etatLieu, $inventaires);
        }

        return $etatLieu->load(['contrat.bien', 'contrat.clients', 'location', 'inventaires']);
    }

    public function destroy(EtatLieu $etatLieu): void
    {
        $etatLieu->delete();
    }

    private function syncInventaires(EtatLieu $etatLieu, array $items): void
    {
        $etatLieu->inventaires()->delete();

        foreach ($items as $item) {
            $etatLieu->inventaires()->create([
                'piece'       => $item['piece'],
                'categorie'   => $item['categorie'],
                'designation' => $item['designation'],
                'description' => $item['description'] ?? null,
                'date'        => $item['date'] ?? null,
            ]);
        }
    }
}
