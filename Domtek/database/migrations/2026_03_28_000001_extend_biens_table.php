<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('biens', function (Blueprint $table) {
            // Rename titre → designation
            $table->renameColumn('titre', 'designation');

            // Numéro d'unité (appartement/lot) — après bloc
            $table->string('num', 20)->nullable()->after('bloc');

            // Type de location (meublé / non meublé) — après type_transaction
            $table->enum('type_location', ['meuble', 'non_meuble'])->nullable()->after('type_transaction');

            // Finance — après prix
            $table->decimal('taxe_fonciere', 15, 2)->nullable()->after('prix');
            $table->enum('regime_juridique', ['mono_propriete', 'co_propriete'])->nullable()->after('taxe_fonciere');

            // Superficie commune — après superficie
            $table->decimal('superficie_commune', 10, 2)->nullable()->after('superficie');

            // Pièces supplémentaires — après nb_salles_bain
            $table->integer('nb_cuisine')->nullable()->after('nb_salles_bain');

            // Date de construction — après nb_cuisine
            $table->date('date_construction')->nullable()->after('nb_cuisine');

            // Localisation — après ville
            $table->string('pays', 100)->nullable()->after('ville');
            $table->string('code_postal', 20)->nullable()->after('pays');

            // Conditions locataires — après statut
            $table->boolean('accepte_animaux')->default(false)->after('statut');
            $table->boolean('accepte_fumeurs')->default(false)->after('accepte_animaux');

            // Équipements (JSON) — après accepte_fumeurs
            $table->json('options')->nullable()->after('accepte_fumeurs');

            // Notes — après description
            $table->text('notes')->nullable()->after('description');
        });

        // Étendre l'enum type_bien avec de nouveaux types
        DB::statement("ALTER TABLE biens MODIFY type_bien ENUM(
            'appartement','maison','villa','bureau','terrain',
            'studio','duplex','local_commercial','entrepot','ferme','autre'
        ) DEFAULT 'appartement'");

        // Table documents liés aux biens
        Schema::create('bien_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');
            $table->string('nom');
            $table->string('chemin');
            $table->string('type_document', 50)->nullable(); // titre_foncier, plan, autre…
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bien_documents');

        DB::statement("ALTER TABLE biens MODIFY type_bien ENUM(
            'appartement','maison','villa','bureau','terrain','autre'
        ) DEFAULT 'appartement'");

        Schema::table('biens', function (Blueprint $table) {
            $table->dropColumn([
                'num', 'type_location', 'taxe_fonciere', 'regime_juridique',
                'superficie_commune', 'nb_cuisine', 'date_construction',
                'pays', 'code_postal', 'accepte_animaux', 'accepte_fumeurs',
                'options', 'notes',
            ]);
            $table->renameColumn('designation', 'titre');
        });
    }
};
