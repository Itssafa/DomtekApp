<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('location_quittances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();

            $table->string('periode', 7);                       // YYYY-MM
            $table->date('date_echeance');
            $table->decimal('montant', 15, 2);

            $table->decimal('montant_paye', 15, 2)->nullable();
            $table->date('date_paiement')->nullable();

            $table->enum('statut', ['prevu', 'paye', 'impaye', 'partiel', 'paye_en_retard'])
                ->default('prevu');

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['location_id', 'periode']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('location_quittances');
    }
};
