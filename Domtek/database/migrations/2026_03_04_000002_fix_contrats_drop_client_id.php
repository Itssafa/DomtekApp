<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Créer la table pivot si elle n'existe pas encore (au cas où la 1ère migration a échoué)
        if (!Schema::hasTable('client_contrat')) {
            Schema::create('client_contrat', function (Blueprint $table) {
                $table->foreignId('contrat_id')->constrained('contrats')->onDelete('cascade');
                $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
                $table->primary(['contrat_id', 'client_id']);
            });
        }

        // Supprimer client_id si la colonne existe encore
        if (Schema::hasColumn('contrats', 'client_id')) {
            // Migrer les données restantes vers le pivot
            $rows = DB::table('contrats')->whereNotNull('client_id')->get();
            foreach ($rows as $contrat) {
                DB::table('client_contrat')->insertOrIgnore([
                    'contrat_id' => $contrat->id,
                    'client_id'  => $contrat->client_id,
                ]);
            }

            // Supprimer la contrainte FK en raw SQL (insensible au nom généré)
            try {
                DB::statement('ALTER TABLE `contrats` DROP FOREIGN KEY `contrats_client_id_foreign`');
            } catch (\Exception $e) {
                // Contrainte déjà supprimée ou nom différent — on continue
            }

            // Supprimer la colonne en raw SQL
            DB::statement('ALTER TABLE `contrats` DROP COLUMN `client_id`');
        }
    }

    public function down(): void
    {
        Schema::table('contrats', function (Blueprint $table) {
            $table->foreignId('client_id')->nullable()->constrained('clients')->onDelete('cascade');
        });

        Schema::dropIfExists('client_contrat');
    }
};
