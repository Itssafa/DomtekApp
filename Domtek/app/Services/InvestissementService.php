<?php

namespace App\Services;

use App\Models\TauxInvestissement;
use Illuminate\Pagination\LengthAwarePaginator;

class InvestissementService
{
    /**
     * Liste paginée des taux d'investissement d'une organisation.
     */
    public function index(int $orgId): LengthAwarePaginator
    {
        return TauxInvestissement::where('organisation_id', $orgId)
            ->latest()
            ->paginate(15);
    }

    /**
     * Créer un nouveau taux d'investissement.
     */
    public function store(int $orgId, array $data): TauxInvestissement
    {
        $data['organisation_id'] = $orgId;
        return TauxInvestissement::create($data);
    }

    /**
     * Mettre à jour un taux d'investissement existant.
     */
    public function update(TauxInvestissement $investissement, array $data): TauxInvestissement
    {
        $investissement->update($data);
        return $investissement;
    }

    /**
     * Supprimer un taux d'investissement.
     */
    public function destroy(TauxInvestissement $investissement): void
    {
        $investissement->delete();
    }
}
