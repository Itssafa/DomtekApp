<?php

namespace App\Console\Commands;

use App\Models\Annonce;
use Illuminate\Console\Command;

class PublierAnnonces extends Command
{
    protected $signature   = 'annonces:publier';
    protected $description = 'Publie les annonces planifiées dont la date de publication est atteinte.';

    public function handle(): int
    {
        $count = Annonce::where('statut', Annonce::STATUT_PLANIFIEE)
            ->where('date_publication', '<=', now())
            ->update(['statut' => Annonce::STATUT_PUBLIEE]);

        $this->info("{$count} annonce(s) publiée(s) automatiquement.");

        return Command::SUCCESS;
    }
}
