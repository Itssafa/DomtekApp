<?php

namespace App\Policies;

use App\Models\Annonce;
use App\Models\User;

class AnnoncePolicy
{
    public function view(User $user, Annonce $annonce): bool
    {
        return $user->resolveOrgId() === $annonce->organisation_id;
    }

    public function update(User $user, Annonce $annonce): bool
    {
        return $user->resolveOrgId() === $annonce->organisation_id;
    }

    public function delete(User $user, Annonce $annonce): bool
    {
        return $user->resolveOrgId() === $annonce->organisation_id;
    }
}
