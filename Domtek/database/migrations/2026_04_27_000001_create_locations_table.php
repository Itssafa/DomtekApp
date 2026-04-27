<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->onDelete('cascade');
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');

            // Locataire : client existant, prospect existant, ou nouveau (nom libre)
            $table->enum('locataire_type', ['client', 'prospect', 'nouveau'])->default('client');
            $table->unsignedBigInteger('locataire_id')->nullable();   // client_id ou prospect_id
            $table->string('locataire_nom')->nullable();               // pour type "nouveau"

            // Identité du contrat
            $table->string('designation')->nullable();
            $table->enum('type', [
                'bail_habitation', 'bail_etudiant', 'bail_professionnel',
                'bail_commercial', 'bail_saisonnier', 'loyer',
            ])->default('bail_habitation');
            $table->string('utilisation')->nullable();

            // Dates
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->date('premiere_echeance');

            // Financier
            $table->decimal('montant_ht', 15, 2)->default(0);
            $table->decimal('tva', 5, 2)->default(0);
            $table->decimal('montant_ttc', 15, 2)->default(0);         // auto-calculé
            $table->decimal('frais_syndic', 15, 2)->default(0);
            $table->decimal('retenue_source', 5, 2)->default(0);
            $table->decimal('montant_paiement', 15, 2)->default(0);    // auto-calculé

            // Paiement
            $table->enum('periodicite', ['mensuel', 'trimestriel', 'semestriel', 'annuel'])->default('mensuel');
            $table->unsignedTinyInteger('jour_paiement')->default(1);  // 1-28

            // Garantie & autres
            $table->decimal('depot_garantie', 15, 2)->default(0);
            $table->boolean('renouvellement_auto')->default(false);
            $table->string('assurance')->nullable();
            $table->string('fichier')->nullable();
            $table->text('notes')->nullable();

            $table->enum('statut', ['actif', 'expire', 'resilie'])->default('actif');

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
