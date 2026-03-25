<?php

namespace App\Services;

use App\Models\Employe;
use Illuminate\Pagination\LengthAwarePaginator;

class EmployeService
{
    /**
     * Liste paginée des employés d'une organisation avec filtres optionnels.
     */
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        $query = Employe::where('organisation_id', $orgId);

        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('poste', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);
        return $query->latest()->paginate($perPage);
    }

    /**
     * Créer un nouvel employé pour une organisation.
     */
    public function store(int $orgId, array $data): Employe
    {
        $data['organisation_id'] = $orgId;
        return Employe::create($data);
    }

    /**
     * Mettre à jour un employé existant.
     */
    public function update(Employe $employe, array $data): Employe
    {
        $employe->update($data);
        return $employe;
    }

    /**
     * Supprimer un employé.
     */
    public function destroy(Employe $employe): void
    {
        $employe->delete();
    }
}
