<?php

namespace App\Policies;

use App\Models\Bien;
use App\Models\User;

class BienPolicy
{
    public function view(User $user, Bien $bien): bool
    {
        return $user->organisation?->id === $bien->organisation_id;
    }

    public function update(User $user, Bien $bien): bool
    {
        return $user->organisation?->id === $bien->organisation_id;
    }

    public function delete(User $user, Bien $bien): bool
    {
        return $user->organisation?->id === $bien->organisation_id;
    }
}
