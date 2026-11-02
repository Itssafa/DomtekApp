<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Les suggestions sont désormais choisies par l'IA, qui explique chacune
 * d'elles : la raison est conservée pour être affichée au tableau de bord.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prospect_suggestions', function (Blueprint $table) {
            $table->string('raison', 255)->nullable()->after('score');
        });
    }

    public function down(): void
    {
        Schema::table('prospect_suggestions', function (Blueprint $table) {
            $table->dropColumn('raison');
        });
    }
};
