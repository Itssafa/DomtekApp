<?php

namespace App\Services;

use App\Models\Organisation;
use Illuminate\Pagination\LengthAwarePaginator;

class OrganisationService
{
    /**
     * Liste paginée de toutes les organisations avec filtres.
     */
    public function index(array $filters = []): LengthAwarePaginator
    {
        $query = Organisation::with('user')
            ->withCount(['biens', 'annonces', 'clients', 'contrats']);

        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('ville', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate(15);
    }

    /**
     * Activer une organisation et enregistrer l'auteur de la modification.
     */
    public function activer(Organisation $organisation): Organisation
    {
        $organisation->update([
            'statut'     => Organisation::STATUT_ACTIVE,
            'updated_by' => auth()->id(),
        ]);

        return $organisation;
    }

    /**
     * Désactiver une organisation et enregistrer l'auteur de la modification.
     */
    public function desactiver(Organisation $organisation): Organisation
    {
        $organisation->update([
            'statut'     => Organisation::STATUT_INACTIVE,
            'updated_by' => auth()->id(),
        ]);

        return $organisation;
    }

    /**
     * Supprimer une organisation et son utilisateur propriétaire.
     */
    public function destroy(Organisation $organisation): void
    {
        $organisation->user()->delete();
        $organisation->delete();
    }
}
