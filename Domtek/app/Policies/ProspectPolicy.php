<?php

namespace App\Policies;

use App\Models\Prospect;
use App\Models\User;

class ProspectPolicy
{
    public function view(User $user, Prospect $prospect): bool
    {
        return $user->resolveOrgId() === $prospect->organisation_id;
    }

    public function update(User $user, Prospect $prospect): bool
    {
        return $user->resolveOrgId() === $prospect->organisation_id;
    }

    public function delete(User $user, Prospect $prospect): bool
    {
        return $user->resolveOrgId() === $prospect->organisation_id;
    }
}
