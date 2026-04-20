<?php

namespace App\Services;

use App\Models\Visite;
use Illuminate\Pagination\LengthAwarePaginator;

class VisiteService
{
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        $query = Visite::where('organisation_id', $orgId)
            ->with(['prospect', 'bien', 'employe']);

        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }
        if (!empty($filters['prospect_id'])) {
            $query->where('prospect_id', $filters['prospect_id']);
        }
        if (!empty($filters['employe_id'])) {
            $query->where('employe_id', $filters['employe_id']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);
        return $query->orderBy('date_visite', 'desc')->paginate($perPage);
    }

    public function store(int $orgId, array $data): Visite
    {
        $data['organisation_id'] = $orgId;
        $visite = Visite::create($data);
        return $visite->load(['prospect', 'bien', 'employe']);
    }

    public function update(Visite $visite, array $data): Visite
    {
        $visite->update($data);
        return $visite->load(['prospect', 'bien', 'employe']);
    }

    public function destroy(Visite $visite): void
    {
        $visite->delete();
    }
}
