<?php

namespace App\Services;

use App\Models\EtatLieu;
use Illuminate\Pagination\LengthAwarePaginator;

class EtatLieuService
{
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        $query = EtatLieu::where('organisation_id', $orgId)
            ->with(['contrat.bien', 'contrat.clients']);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (!empty($filters['contrat_id'])) {
            $query->where('contrat_id', $filters['contrat_id']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);
        return $query->latest('date')->paginate($perPage);
    }

    public function store(int $orgId, array $data): EtatLieu
    {
        $data['organisation_id'] = $orgId;
        $etatLieu = EtatLieu::create($data);
        return $etatLieu->load(['contrat.bien', 'contrat.clients']);
    }

    public function update(EtatLieu $etatLieu, array $data): EtatLieu
    {
        $etatLieu->update($data);
        return $etatLieu->load(['contrat.bien', 'contrat.clients']);
    }

    public function destroy(EtatLieu $etatLieu): void
    {
        $etatLieu->delete();
    }
}
