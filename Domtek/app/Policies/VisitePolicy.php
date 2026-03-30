<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Visite;

class VisitePolicy
{
    public function view(User $user, Visite $visite): bool
    {
        return $user->organisation?->id === $visite->organisation_id;
    }

    public function update(User $user, Visite $visite): bool
    {
        return $user->organisation?->id === $visite->organisation_id;
    }

    public function delete(User $user, Visite $visite): bool
    {
        return $user->organisation?->id === $visite->organisation_id;
    }
}
