<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organisation_id')->constrained('organisations')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('contrat_id')->nullable()->constrained('contrats')->onDelete('set null');
            $table->enum('type', ['eau', 'electricite', 'gaz']);
            $table->decimal('montant', 10, 2);
            $table->date('date_emission');
            $table->date('date_echeance');
            $table->enum('statut', ['en_attente', 'payee', 'en_retard'])->default('en_attente');
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
