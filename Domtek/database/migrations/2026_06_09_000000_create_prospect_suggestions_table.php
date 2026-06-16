<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prospect_suggestions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organisation_id');
            $table->unsignedBigInteger('prospect_id');
            $table->unsignedBigInteger('bien_id');
            $table->unsignedTinyInteger('score')->default(0);
            $table->timestamps();

            $table->foreign('prospect_id')->references('id')->on('prospects')->onDelete('cascade');
            $table->foreign('bien_id')->references('id')->on('biens')->onDelete('cascade');
            $table->unique(['prospect_id', 'bien_id']);
            $table->index('organisation_id');
            $table->index(['organisation_id', 'score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prospect_suggestions');
    }
};
