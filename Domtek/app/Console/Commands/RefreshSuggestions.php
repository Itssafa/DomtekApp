<?php

namespace App\Console\Commands;

use App\Models\Organisation;
use App\Models\Prospect;
use App\Services\ProspectMatchingService;
use Illuminate\Console\Command;

class RefreshSuggestions extends Command
{
    protected $signature   = 'suggestions:refresh {--org= : ID de l\'organisation (toutes si absent)}';
    protected $description = 'Recalcule toutes les suggestions prospect-bien';

    public function handle(ProspectMatchingService $service): int
    {
        $orgId = $this->option('org');

        $query = Prospect::whereNull('client_id');
        if ($orgId) $query->where('organisation_id', $orgId);

        $prospects = $query->get();

        if ($prospects->isEmpty()) {
            $this->warn('Aucun prospect actif trouvé.');
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($prospects->count());
        $bar->start();

        foreach ($prospects as $prospect) {
            $service->refreshForProspect($prospect);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Suggestions recalculées pour {$prospects->count()} prospect(s).");

        return self::SUCCESS;
    }
}
