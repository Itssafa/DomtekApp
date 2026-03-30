<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('etat_lieux', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->onDelete('cascade');
            $table->foreignId('contrat_id')->constrained('contrats')->onDelete('cascade');
            $table->string('designation')->nullable();
            $table->enum('type', ['entree', 'sortie'])->default('entree');
            $table->date('date');
            $table->decimal('releve_eau', 10, 3)->nullable();
            $table->decimal('releve_electricite', 10, 3)->nullable();
            $table->decimal('releve_gaz', 10, 3)->nullable();
            $table->boolean('remise_cles')->default(false);
            $table->text('commentaire')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('etat_lieux');
    }
};
