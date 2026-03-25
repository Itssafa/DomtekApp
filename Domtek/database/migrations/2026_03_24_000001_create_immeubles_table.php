<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('immeubles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->onDelete('cascade');
            $table->string('nom');
            $table->enum('type_usage',    ['residentiel', 'professionnel', 'mixte'])->default('residentiel');
            $table->enum('type_propriete',['auto_propriete', 'co_propriete'])->default('auto_propriete');
            $table->boolean('a_blocs')->default(false);
            $table->unsignedSmallInteger('nb_blocs')->nullable();
            $table->unsignedSmallInteger('nb_etages')->default(0);
            $table->string('adresse')->nullable();
            $table->string('ville')->nullable();
            $table->string('pays')->default('Tunisie');
            $table->boolean('sous_sol')->default(false);
            $table->boolean('cameras_surveillance')->default(false);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });

        Schema::create('immeuble_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('immeuble_id')->constrained('immeubles')->onDelete('cascade');
            $table->string('chemin');
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('immeuble_photos');
        Schema::dropIfExists('immeubles');
    }
};
