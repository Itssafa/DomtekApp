<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contrats', function (Blueprint $table) {
            $table->string('forme_juridique')->nullable()->after('notes');
            $table->string('representant')->nullable()->after('forme_juridique');
            $table->date('date_contrat')->nullable()->after('representant');
            $table->string('ville_signature')->nullable()->after('date_contrat');
            $table->date('cin_delivree_le')->nullable()->after('ville_signature');
        });
    }

    public function down(): void
    {
        Schema::table('contrats', function (Blueprint $table) {
            $table->dropColumn(['forme_juridique', 'representant', 'date_contrat', 'ville_signature', 'cin_delivree_le']);
        });
    }
};
