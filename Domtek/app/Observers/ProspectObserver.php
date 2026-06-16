<?php

namespace App\Observers;

use App\Models\Prospect;
use App\Models\ProspectSuggestion;
use App\Services\ProspectMatchingService;

class ProspectObserver
{
    public function __construct(private ProspectMatchingService $matching) {}

    public function created(Prospect $prospect): void
    {
        $this->matching->refreshForProspect($prospect);
    }

    public function updated(Prospect $prospect): void
    {
        $relevant = ['biens_interet', 'revenus_mensuels', 'ville', 'hierarchie_besoins', 'composition_foyer', 'client_id'];
        if ($prospect->wasChanged($relevant)) {
            $this->matching->refreshForProspect($prospect);
        }
    }

    public function deleted(Prospect $prospect): void
    {
        // La FK cascade gère la suppression, mais on nettoie explicitement
        ProspectSuggestion::where('prospect_id', $prospect->id)->delete();
    }
}
