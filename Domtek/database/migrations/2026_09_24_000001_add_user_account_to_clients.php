<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Garde-fou : l'index unique (organisation_id, email) échouera s'il
        //    existe déjà des doublons. On les signale au lieu de planter sur
        //    une erreur SQL illisible.
        $doublons = DB::table('clients')
            ->select('organisation_id', 'email', DB::raw('COUNT(*) as total'))
            ->whereNotNull('email')
            ->groupBy('organisation_id', 'email')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        if ($doublons->isNotEmpty()) {
            $details = $doublons
                ->map(fn ($d) => "org #{$d->organisation_id} → {$d->email} ({$d->total} fiches)")
                ->implode(' | ');

            throw new RuntimeException(
                "Impossible d'ajouter l'index unique : des clients partagent déjà la même "
                . "adresse e-mail au sein d'une organisation. Corrigez ces doublons puis "
                . "relancez la migration. Doublons détectés — {$details}"
            );
        }

        Schema::table('clients', function (Blueprint $table) {
            // 2. Rattachement au compte utilisateur (null = pas encore d'accès).
            //    nullOnDelete : supprimer le compte ne supprime pas la fiche client.
            $table->foreignId('user_id')
                ->nullable()
                ->after('organisation_id')
                ->constrained('users')
                ->nullOnDelete();

            // 3. Unicité de l'e-mail par agence (et non globale) : une même
            //    personne peut être cliente de plusieurs organisations.
            //    MySQL autorise plusieurs NULL dans un index unique, donc les
            //    fiches historiques sans e-mail restent valides.
            $table->unique(['organisation_id', 'email'], 'clients_org_email_unique');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropUnique('clients_org_email_unique');
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
