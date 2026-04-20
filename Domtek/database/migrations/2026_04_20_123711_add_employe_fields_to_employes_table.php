<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->date('date_naissance')->nullable()->after('email');
            // Change enum to add 'en_attente'
            $table->enum('statut', ['actif', 'inactif', 'en_attente'])->default('actif')->change();
        });
    }

    public function down(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->dropColumn('date_naissance');
            $table->enum('statut', ['actif', 'inactif'])->default('actif')->change();
        });
    }
};
