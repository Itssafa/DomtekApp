<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('etat_lieux', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->after('contrat_id')
                  ->constrained('locations')->nullOnDelete();
            $table->foreignId('contrat_id')->nullable()->change();
        });

        Schema::create('etat_lieu_inventaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('etat_lieu_id')->constrained('etat_lieux')->cascadeOnDelete();
            $table->string('piece', 100);
            $table->enum('categorie', ['meuble', 'electromenager', 'equipement', 'textile']);
            $table->string('designation', 255);
            $table->text('description')->nullable();
            $table->date('date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('etat_lieu_inventaires');
        Schema::table('etat_lieux', function (Blueprint $table) {
            $table->dropConstrainedForeignId('location_id');
        });
    }
};
