<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->enum('civilite', ['M.', 'Mme', 'Mlle'])->nullable()->after('prenom');
            $table->string('lieu_naissance')->nullable()->after('date_naissance');
            $table->enum('type_piece', ['CIN', 'Passeport'])->nullable()->after('cin');
            $table->string('document_identite')->nullable()->after('type_piece');
            $table->string('urgence_nom')->nullable()->after('ville');
            $table->string('urgence_telephone', 20)->nullable()->after('urgence_nom');
            $table->string('urgence_relation', 50)->nullable()->after('urgence_telephone');
            $table->text('notes')->nullable()->after('urgence_relation');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'civilite', 'lieu_naissance', 'type_piece', 'document_identite',
                'urgence_nom', 'urgence_telephone', 'urgence_relation', 'notes',
            ]);
        });
    }
};
