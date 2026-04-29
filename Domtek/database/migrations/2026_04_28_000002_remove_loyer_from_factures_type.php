<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE factures SET type = 'eau' WHERE type = 'loyer'");
        DB::statement("ALTER TABLE factures MODIFY COLUMN type ENUM('eau','electricite','gaz','electricite_gaz') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE factures MODIFY COLUMN type ENUM('eau','electricite','gaz','electricite_gaz','loyer') NOT NULL");
    }
};
