<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('biens', function (Blueprint $table) {
            $table->text('maps_url')->nullable()->after('code_postal');
        });

        Schema::table('immeubles', function (Blueprint $table) {
            $table->text('maps_url')->nullable()->after('pays');
        });
    }

    public function down(): void
    {
        Schema::table('biens', function (Blueprint $table) {
            $table->dropColumn('maps_url');
        });

        Schema::table('immeubles', function (Blueprint $table) {
            $table->dropColumn('maps_url');
        });
    }
};
