<?php

namespace App\Traits;

trait ResolvesOrgId
{
    protected function orgId(): int
    {
        $user = auth()->user();
        if ($user->isEmploye()) {
            return $user->employe->organisation_id;
        }
        return $user->organisation->id;
    }
}
