<?php

namespace App\Policies;

use App\Models\Employe;
use App\Models\User;

class EmployePolicy
{
    public function view(User $user, Employe $employe): bool
    {
        return $user->organisation?->id === $employe->organisation_id;
    }

    public function update(User $user, Employe $employe): bool
    {
        return $user->organisation?->id === $employe->organisation_id;
    }

    public function delete(User $user, Employe $employe): bool
    {
        return $user->organisation?->id === $employe->organisation_id;
    }
}
