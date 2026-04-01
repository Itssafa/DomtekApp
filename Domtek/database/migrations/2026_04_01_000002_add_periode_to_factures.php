<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->date('periode_debut')->nullable()->after('date_echeance');
            $table->date('periode_fin')->nullable()->after('periode_debut');
        });
    }

    public function down(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->dropColumn(['periode_debut', 'periode_fin']);
        });
    }
};
