<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // ── Compte Admin ─────────────────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'admin@domtek.tn'],
            [
                'name'      => 'Administrateur',
                'password'  => Hash::make('Admin@2025'),
                'role'      => User::ROLE_ADMIN,
                'is_active' => true,
            ]
        );

        // ── Compte utilisateur de test (organisation) ─────────────────────
        User::updateOrCreate(
            ['email' => 'test@domtek.tn'],
            [
                'name'      => 'Utilisateur Test',
                'password'  => Hash::make('Test@2025'),
                'role'      => User::ROLE_ORGANISATION,
                'is_active' => true,
            ]
        );

        $this->command->info('✓ Compte admin     : admin@domtek.tn  /  Admin@2025');
        $this->command->info('✓ Compte test org  : test@domtek.tn   /  Test@2025');
    }
}
