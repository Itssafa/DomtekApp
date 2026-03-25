<?php

namespace App\Policies;

use App\Models\Contrat;
use App\Models\User;

class ContratPolicy
{
    public function view(User $user, Contrat $contrat): bool
    {
        return $user->organisation?->id === $contrat->organisation_id;
    }

    public function update(User $user, Contrat $contrat): bool
    {
        return $user->organisation?->id === $contrat->organisation_id;
    }

    public function delete(User $user, Contrat $contrat): bool
    {
        return $user->organisation?->id === $contrat->organisation_id;
    }
}
