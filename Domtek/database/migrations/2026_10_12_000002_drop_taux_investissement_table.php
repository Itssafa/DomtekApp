<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Supprime la rubrique « taux d'investissement », remplacée à l'écran par le
 * tableau de bord statistique (cf. StatistiqueController). La table était vide
 * au moment de la suppression.
 *
 * Le down() recrée la table à l'identique de la migration d'origine
 * (2026_02_28_000010), pour qu'un rollback reste possible.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('taux_investissement');
    }

    public function down(): void
    {
        Schema::create('taux_investissement', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->onDelete('cascade');
            $table->decimal('taux', 5, 2);
            $table->enum('periode', ['mensuel', 'trimestriel', 'annuel'])->default('annuel');
            $table->string('description')->nullable();
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }
};
