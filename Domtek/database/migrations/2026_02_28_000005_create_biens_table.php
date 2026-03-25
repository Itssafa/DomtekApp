<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->onDelete('cascade');
            $table->string('titre');
            $table->text('description')->nullable();
            $table->enum('type_transaction', ['vente', 'loyer']);
            $table->enum('type_bien', ['appartement', 'maison', 'villa', 'bureau', 'terrain', 'autre'])->default('appartement');
            $table->decimal('prix', 15, 2);
            $table->decimal('superficie', 10, 2)->nullable();
            $table->string('adresse')->nullable();
            $table->string('ville')->nullable();
            $table->integer('nb_pieces')->nullable();
            $table->integer('nb_chambres')->nullable();
            $table->integer('nb_salles_bain')->nullable();
            $table->integer('etage')->nullable();
            $table->enum('statut', ['disponible', 'vendu', 'loue', 'indisponible'])->default('disponible');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biens');
    }
};
