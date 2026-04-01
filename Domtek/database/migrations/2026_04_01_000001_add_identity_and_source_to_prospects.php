<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->date('cin_delivree_le')->nullable()->after('cin');
            $table->string('cin_delivree_a', 100)->nullable()->after('cin_delivree_le');
            $table->string('source_connaissance', 50)->nullable()->after('notes');
            $table->string('source_connaissance_detail', 150)->nullable()->after('source_connaissance');
        });
    }

    public function down(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->dropColumn([
                'cin_delivree_le',
                'cin_delivree_a',
                'source_connaissance',
                'source_connaissance_detail',
            ]);
        });
    }
};
