<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add columns only if they don't already exist (handles partial migration state)
        if (!Schema::hasColumn('contrats', 'designation')) {
            Schema::table('contrats', function (Blueprint $table) {
                // Identité du contrat
                $table->string('designation')->nullable()->after('id');
                $table->string('utilisation', 50)->nullable()->after('designation');

                // Données financières HT / TVA / TTC (renaming montant → montant_ht via raw SQL below)
                $table->decimal('tva', 5, 2)->default(0)->after('montant');
                $table->decimal('montant_ttc', 15, 2)->nullable()->after('tva');
                $table->decimal('frais_syndic', 15, 2)->nullable()->after('montant_ttc');
                $table->decimal('retenue_source', 5, 2)->nullable()->after('frais_syndic'); // pourcentage
                $table->decimal('montant_paiement', 15, 2)->nullable()->after('retenue_source');

                // Périodicité & calendrier
                $table->string('periodicite_paiement', 20)->nullable()->after('montant_paiement');
                $table->tinyInteger('jour_paiement')->nullable()->after('periodicite_paiement'); // 1–28
                $table->decimal('depot_garantie', 15, 2)->nullable()->after('jour_paiement');
                $table->date('premiere_echeance')->nullable()->after('depot_garantie');

                // Assurance
                $table->text('assurance')->nullable()->after('notes');
            });
        }

        // Renommer montant → montant_ht si la colonne montant existe encore (compatible MariaDB)
        if (Schema::hasColumn('contrats', 'montant')) {
            DB::statement('ALTER TABLE contrats CHANGE `montant` `montant_ht` decimal(15,2) NOT NULL');
        }

        // Étendre l'enum type
        DB::statement("ALTER TABLE contrats MODIFY type ENUM(
            'bail_habitation','bail_etudiant','bail_professionnel',
            'bail_commercial','bail_saisonnier','loyer','vente','autre'
        ) NOT NULL DEFAULT 'bail_habitation'");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE contrats CHANGE `montant_ht` `montant` decimal(15,2) NOT NULL');

        DB::statement("ALTER TABLE contrats MODIFY type ENUM('vente','loyer') NOT NULL");

        Schema::table('contrats', function (Blueprint $table) {
            $table->dropColumn([
                'designation', 'utilisation',
                'tva', 'montant_ttc', 'frais_syndic',
                'retenue_source', 'montant_paiement',
                'periodicite_paiement', 'jour_paiement',
                'depot_garantie', 'premiere_echeance',
                'assurance',
            ]);
        });
    }
};
