<?php

namespace App\Policies;

use App\Models\EtatLieu;
use App\Models\User;

class EtatLieuPolicy
{
    public function view(User $user, EtatLieu $etatLieu): bool
    {
        return $user->resolveOrgId() === $etatLieu->organisation_id;
    }

    public function update(User $user, EtatLieu $etatLieu): bool
    {
        return $user->resolveOrgId() === $etatLieu->organisation_id;
    }

    public function delete(User $user, EtatLieu $etatLieu): bool
    {
        return $user->resolveOrgId() === $etatLieu->organisation_id;
    }
}
