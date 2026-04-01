<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 0. Nettoyage — ordre important : les tables dépendantes d'abord
        //    prospect_contrat doit être supprimée avant client_contrat car ses FKs
        //    portent encore les noms "client_contrat_*" (hérités du RENAME TABLE).
        Schema::dropIfExists('prospect_contrat');
        Schema::dropIfExists('client_contrat');
        Schema::dropIfExists('clients');

        // 1. Renommer les contraintes FK orphelines sur "prospects" (nommées "clients_*")
        //    MariaDB/MySQL ne renomme pas les FKs lors d'un RENAME TABLE.
        $this->renommerFkProspects();

        // 2. Créer la table clients
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained()->cascadeOnDelete();
            $table->enum('civilite', ['M.', 'Mme', 'Mlle'])->nullable();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 255)->nullable();
            $table->string('telephone', 20)->nullable();
            $table->string('adresse', 255)->nullable();
            $table->string('ville', 100)->nullable();
            $table->date('date_naissance')->nullable();
            $table->string('lieu_naissance', 100)->nullable();
            $table->enum('type_piece', ['CIN', 'Passeport'])->nullable();
            $table->string('cin', 20)->nullable();
            $table->string('document_identite', 255)->nullable();
            $table->string('urgence_nom', 100)->nullable();
            $table->string('urgence_telephone', 20)->nullable();
            $table->string('urgence_relation', 50)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 3. Pivot client_contrat
        Schema::create('client_contrat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('contrat_id')->constrained('contrats')->cascadeOnDelete();
        });

        // 4. Ajouter client_id à factures (si pas déjà présent)
        if (!Schema::hasColumn('factures', 'client_id')) {
            Schema::table('factures', function (Blueprint $table) {
                $table->foreignId('client_id')->nullable()->after('organisation_id')->constrained('clients')->nullOnDelete();
            });
        }

        // 5. Supprimer prospect_id de factures (si encore présent)
        if (Schema::hasColumn('factures', 'prospect_id')) {
            Schema::table('factures', function (Blueprint $table) {
                // Supprimer la FK si elle existe encore
                try {
                    $table->dropForeign(['prospect_id']);
                } catch (\Throwable) { /* déjà supprimée */ }
                $table->dropColumn('prospect_id');
            });
        }

        // prospect_contrat déjà supprimé en step 0
    }

    public function down(): void
    {
        if (Schema::hasColumn('factures', 'client_id')) {
            Schema::table('factures', function (Blueprint $table) {
                $table->dropForeign(['client_id']);
                $table->dropColumn('client_id');
            });
        }

        if (!Schema::hasColumn('factures', 'prospect_id')) {
            Schema::table('factures', function (Blueprint $table) {
                $table->foreignId('prospect_id')->nullable()->constrained('prospects')->nullOnDelete();
            });
        }

        Schema::dropIfExists('client_contrat');
        Schema::dropIfExists('clients');

        if (!Schema::hasTable('prospect_contrat')) {
            Schema::create('prospect_contrat', function (Blueprint $table) {
                $table->id();
                $table->foreignId('prospect_id')->constrained('prospects')->cascadeOnDelete();
                $table->foreignId('contrat_id')->constrained('contrats')->cascadeOnDelete();
            });
        }
    }

    /**
     * Renomme les FKs de la table "prospects" dont le nom commence par "clients_"
     * (séquelle du RENAME TABLE clients → prospects sous MariaDB/MySQL).
     */
    private function renommerFkProspects(): void
    {
        $database = DB::getDatabaseName();

        $fks = DB::select("
            SELECT kcu.CONSTRAINT_NAME  AS constraint_name,
                   kcu.COLUMN_NAME      AS column_name,
                   kcu.REFERENCED_TABLE_NAME  AS ref_table,
                   kcu.REFERENCED_COLUMN_NAME AS ref_column,
                   rc.DELETE_RULE       AS delete_rule
            FROM information_schema.KEY_COLUMN_USAGE AS kcu
            JOIN information_schema.REFERENTIAL_CONSTRAINTS AS rc
                ON  rc.CONSTRAINT_NAME   = kcu.CONSTRAINT_NAME
                AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
            WHERE kcu.TABLE_SCHEMA    = ?
              AND kcu.TABLE_NAME      = 'prospects'
              AND kcu.CONSTRAINT_NAME LIKE 'clients_%'
        ", [$database]);

        foreach ($fks as $fk) {
            $oldName  = $fk->constraint_name;
            $column   = $fk->column_name;
            $refTable = $fk->ref_table;
            $refCol   = $fk->ref_column;
            $onDelete = strtoupper($fk->delete_rule);
            $newName  = 'prospects_' . substr($oldName, strlen('clients_'));

            DB::statement("ALTER TABLE `prospects` DROP FOREIGN KEY `{$oldName}`");
            DB::statement("
                ALTER TABLE `prospects`
                ADD CONSTRAINT `{$newName}`
                FOREIGN KEY (`{$column}`) REFERENCES `{$refTable}` (`{$refCol}`)
                ON DELETE {$onDelete}
            ");
        }
    }
};
