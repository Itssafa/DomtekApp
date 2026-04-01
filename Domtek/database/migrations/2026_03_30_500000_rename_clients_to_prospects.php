<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Supprimer les FK qui référencent clients
        DB::statement('ALTER TABLE `factures` DROP FOREIGN KEY `factures_client_id_foreign`');
        DB::statement('ALTER TABLE `visites` DROP FOREIGN KEY `visites_client_id_foreign`');
        DB::statement('ALTER TABLE `client_contrat` DROP FOREIGN KEY `client_contrat_client_id_foreign`');

        // 2. Renommer la table principale
        Schema::rename('clients', 'prospects');

        // 3. Renommer la table pivot
        Schema::rename('client_contrat', 'prospect_contrat');

        // 4. Renommer client_id → prospect_id dans les tables référençantes
        DB::statement('ALTER TABLE `factures` CHANGE `client_id` `prospect_id` BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE `visites` CHANGE `client_id` `prospect_id` BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE `prospect_contrat` CHANGE `client_id` `prospect_id` BIGINT UNSIGNED NOT NULL');

        // 5. Recréer les FK
        DB::statement('ALTER TABLE `factures` ADD CONSTRAINT `factures_prospect_id_foreign` FOREIGN KEY (`prospect_id`) REFERENCES `prospects` (`id`) ON DELETE CASCADE');
        DB::statement('ALTER TABLE `visites` ADD CONSTRAINT `visites_prospect_id_foreign` FOREIGN KEY (`prospect_id`) REFERENCES `prospects` (`id`) ON DELETE CASCADE');
        DB::statement('ALTER TABLE `prospect_contrat` ADD CONSTRAINT `prospect_contrat_prospect_id_foreign` FOREIGN KEY (`prospect_id`) REFERENCES `prospects` (`id`) ON DELETE CASCADE');
        DB::statement('ALTER TABLE `prospect_contrat` ADD CONSTRAINT `prospect_contrat_contrat_id_foreign` FOREIGN KEY (`contrat_id`) REFERENCES `contrats` (`id`) ON DELETE CASCADE');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE `factures` DROP FOREIGN KEY `factures_prospect_id_foreign`');
        DB::statement('ALTER TABLE `visites` DROP FOREIGN KEY `visites_prospect_id_foreign`');
        DB::statement('ALTER TABLE `prospect_contrat` DROP FOREIGN KEY `prospect_contrat_prospect_id_foreign`');
        DB::statement('ALTER TABLE `prospect_contrat` DROP FOREIGN KEY `prospect_contrat_contrat_id_foreign`');

        Schema::rename('prospects', 'clients');
        Schema::rename('prospect_contrat', 'client_contrat');

        DB::statement('ALTER TABLE `factures` CHANGE `prospect_id` `client_id` BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE `visites` CHANGE `prospect_id` `client_id` BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE `client_contrat` CHANGE `prospect_id` `client_id` BIGINT UNSIGNED NOT NULL');

        DB::statement('ALTER TABLE `factures` ADD CONSTRAINT `factures_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE');
        DB::statement('ALTER TABLE `visites` ADD CONSTRAINT `visites_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE');
        DB::statement('ALTER TABLE `client_contrat` ADD CONSTRAINT `client_contrat_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE');
    }
};
