<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('profession')->nullable()->after('notes');
            $table->enum('revenus_mensuels', [
                'moins_1000', '1000_2000', '3000_6000', '7000_10000', 'plus_10000',
            ])->nullable()->after('profession');
            $table->json('composition_foyer')->nullable()->after('revenus_mensuels');
            $table->json('biens_interet')->nullable()->after('composition_foyer');
            $table->enum('score_solvabilite', [
                'verifie', 'plutot_verifie', 'plutot_non_verifie', 'non_verifie',
            ])->nullable()->after('biens_interet');
            $table->json('hierarchie_besoins')->nullable()->after('score_solvabilite');
        });

        Schema::table('visites', function (Blueprint $table) {
            $table->enum('impression_client', [
                'satisfait', 'neutre', 'non_satisfait',
            ])->nullable()->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'profession', 'revenus_mensuels', 'composition_foyer',
                'biens_interet', 'score_solvabilite', 'hierarchie_besoins',
            ]);
        });
        Schema::table('visites', function (Blueprint $table) {
            $table->dropColumn('impression_client');
        });
    }
};
