<?php

namespace App\Policies;

use App\Models\Immeuble;
use App\Models\User;

class ImmeublePolicy
{
    private function owns(User $user, Immeuble $immeuble): bool
    {
        return $user->organisation?->id === $immeuble->organisation_id;
    }

    public function view(User $user, Immeuble $immeuble): bool   { return $this->owns($user, $immeuble); }
    public function update(User $user, Immeuble $immeuble): bool { return $this->owns($user, $immeuble); }
    public function delete(User $user, Immeuble $immeuble): bool { return $this->owns($user, $immeuble); }
}
