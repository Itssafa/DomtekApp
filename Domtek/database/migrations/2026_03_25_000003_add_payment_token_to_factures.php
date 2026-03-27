<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->uuid('payment_token')->nullable()->unique()->after('notes');
            $table->string('stripe_session_id')->nullable()->after('payment_token');
        });
    }

    public function down(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->dropColumn(['payment_token', 'stripe_session_id']);
        });
    }
};
