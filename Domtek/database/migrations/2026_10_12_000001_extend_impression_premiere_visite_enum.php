<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Élargit l'énumération `impression_premiere_visite` aux cinq valeurs que le
 * formulaire propose déjà.
 *
 * Le questionnaire de visite et la validation offrent cinq nuances, mais la
 * colonne n'en avait jamais connu que trois : choisir « Très satisfait » ou
 * « Plutôt non satisfait » provoquait un « Data truncated » de MySQL, donc une
 * erreur 500 à l'enregistrement du prospect. L'interface avait été étendue
 * sans que la colonne suive.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE `prospects` MODIFY COLUMN `impression_premiere_visite` "
            . "ENUM('très_satisfait','satisfait','neutre','plutot_non_satisfait','non_satisfait') NULL"
        );
    }

    public function down(): void
    {
        // Les deux nuances retirées n'existent pas dans l'énumération d'origine :
        // les ramener vers la valeur voisine évite de perdre la ligne.
        DB::table('prospects')->where('impression_premiere_visite', 'très_satisfait')
            ->update(['impression_premiere_visite' => 'satisfait']);
        DB::table('prospects')->where('impression_premiere_visite', 'plutot_non_satisfait')
            ->update(['impression_premiere_visite' => 'non_satisfait']);

        DB::statement(
            "ALTER TABLE `prospects` MODIFY COLUMN `impression_premiere_visite` "
            . "ENUM('satisfait','neutre','non_satisfait') NULL"
        );
    }
};
