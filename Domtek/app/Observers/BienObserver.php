<?php

namespace App\Observers;

use App\Models\Bien;
use App\Services\ProspectMatchingService;

class BienObserver
{
    public function __construct(private ProspectMatchingService $matching) {}

    public function created(Bien $bien): void
    {
        $this->matching->refreshForBien($bien);
    }

    public function updated(Bien $bien): void
    {
        // Recalcule uniquement si les champs pertinents pour le matching ont changé
        $relevant = ['statut', 'prix', 'type_bien', 'type_transaction', 'ville', 'options', 'accepte_animaux'];
        if ($bien->wasChanged($relevant)) {
            $this->matching->refreshForBien($bien);
        }
    }

    public function deleted(Bien $bien): void
    {
        // La FK cascade supprime les lignes prospect_suggestions,
        // mais on force ici pour être explicite
        $this->matching->deleteForBien($bien->id);
    }
}
