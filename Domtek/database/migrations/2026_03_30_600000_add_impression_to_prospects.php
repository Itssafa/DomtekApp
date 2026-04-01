<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->enum('impression_premiere_visite', ['satisfait', 'neutre', 'non_satisfait'])
                  ->nullable()
                  ->after('score_solvabilite');
        });
    }

    public function down(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->dropColumn('impression_premiere_visite');
        });
    }
};
