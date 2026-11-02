<?php

namespace App\Observers;

use App\Models\Prospect;
use App\Models\ProspectSuggestion;
use App\Services\ProspectMatchingService;

class ProspectObserver
{
    public function __construct(private ProspectMatchingService $matching) {}

    // Recalcul par l'IA en arrière-plan : l'enregistrement du prospect n'attend pas.
    public function created(Prospect $prospect): void
    {
        $this->matching->planifierPourProspect($prospect);
    }

    public function updated(Prospect $prospect): void
    {
        // Converti en client : il n'est plus un prospect à qui suggérer des biens.
        if ($prospect->wasChanged('client_id') && $prospect->client_id !== null) {
            ProspectSuggestion::where('prospect_id', $prospect->id)->delete();
            return;
        }

        // Tout ce que l'IA lit pour juger l'adéquation.
        $relevant = [
            'biens_interet', 'revenus_mensuels', 'ville', 'hierarchie_besoins', 'composition_foyer',
            'profession', 'civilite', 'date_naissance',
        ];
        if ($prospect->wasChanged($relevant)) {
            $this->matching->planifierPourProspect($prospect);
        }
    }

    public function deleted(Prospect $prospect): void
    {
        // La FK cascade gère la suppression, mais on nettoie explicitement
        ProspectSuggestion::where('prospect_id', $prospect->id)->delete();
    }
}
