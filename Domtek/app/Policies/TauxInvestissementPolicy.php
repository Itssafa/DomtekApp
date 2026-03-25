<?php

namespace App\Policies;

use App\Models\TauxInvestissement;
use App\Models\User;

class TauxInvestissementPolicy
{
    public function view(User $user, TauxInvestissement $taux): bool
    {
        return $user->organisation?->id === $taux->organisation_id;
    }

    public function update(User $user, TauxInvestissement $taux): bool
    {
        return $user->organisation?->id === $taux->organisation_id;
    }

    public function delete(User $user, TauxInvestissement $taux): bool
    {
        return $user->organisation?->id === $taux->organisation_id;
    }
}
