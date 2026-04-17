<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->string('cin', 20)->nullable()->after('telephone');
            $table->date('cin_delivree_le')->nullable()->after('cin');
            $table->string('cin_delivree_a', 100)->nullable()->after('cin_delivree_le');
        });
    }

    public function down(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->dropColumn(['cin', 'cin_delivree_le', 'cin_delivree_a']);
        });
    }
};
