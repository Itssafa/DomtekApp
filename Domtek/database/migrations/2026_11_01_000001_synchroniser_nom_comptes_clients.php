<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Rattrapage des données : le nom des comptes clients recopié depuis leur fiche.
 *
 * Jusqu'ici, un compte créé par inscription Google gardait le nom du profil
 * Google, et une correction du nom faite par l'agence sur la fiche ne
 * remontait jamais jusqu'au compte. Désormais ClientAccountService tient les
 * deux alignés ; cette migration aligne les comptes existants, à partir de la
 * fiche la plus récemment modifiée.
 */
return new class extends Migration
{
    public function up(): void
    {
        $fiches = DB::table('clients')
            ->whereNotNull('user_id')
            ->orderBy('updated_at')
            ->get(['user_id', 'prenom', 'nom']);

        // Parcours chronologique : la fiche la plus récente l'emporte.
        $noms = [];
        foreach ($fiches as $fiche) {
            $nom = trim($fiche->prenom . ' ' . $fiche->nom);
            if ($nom !== '') {
                $noms[$fiche->user_id] = $nom;
            }
        }

        foreach ($noms as $userId => $nom) {
            DB::table('users')
                ->where('id', $userId)
                ->where('role', 'client')
                ->update(['name' => $nom]);
        }
    }

    public function down(): void
    {
        // Irréversible : les anciens noms (profil Google) n'ont pas été conservés.
    }
};
