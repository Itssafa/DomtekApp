<?php

namespace App\Policies;

use App\Models\Facture;
use App\Models\User;

class FacturePolicy
{
    public function view(User $user, Facture $facture): bool
    {
        return $user->resolveOrgId() === $facture->organisation_id;
    }

    public function update(User $user, Facture $facture): bool
    {
        return $user->resolveOrgId() === $facture->organisation_id;
    }

    public function delete(User $user, Facture $facture): bool
    {
        return $user->resolveOrgId() === $facture->organisation_id;
    }
}
