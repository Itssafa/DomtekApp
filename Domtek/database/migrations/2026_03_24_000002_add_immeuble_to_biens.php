<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('biens', function (Blueprint $table) {
            $table->foreignId('immeuble_id')
                  ->nullable()
                  ->after('organisation_id')
                  ->constrained('immeubles')
                  ->onDelete('set null');
            $table->unsignedSmallInteger('bloc')->nullable()->after('immeuble_id');
        });
    }

    public function down(): void
    {
        Schema::table('biens', function (Blueprint $table) {
            $table->dropForeign(['immeuble_id']);
            $table->dropColumn(['immeuble_id', 'bloc']);
        });
    }
};
