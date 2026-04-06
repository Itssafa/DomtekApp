<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->date('cin_delivree_le')->nullable()->after('cin');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('cin_delivree_le');
        });
    }
};
