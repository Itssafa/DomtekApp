<?php

namespace App\Jobs;

use App\Models\Prospect;
use App\Services\ProspectMatchingService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Recalcul, par l'IA, des suggestions d'un prospect.
 *
 * ShouldBeUnique : plusieurs modifications rapprochées (un bien enregistré
 * puis ses photos, par exemple) ne déclenchent qu'un seul appel à l'IA.
 */
class RafraichirSuggestionsProspect implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    /** L'IA peut être momentanément saturée : jusqu'à 5 essais, espacés de 2 minutes. */
    public int $tries = 5;

    /** Secondes pendant lesquelles un doublon est ignoré. */
    public int $uniqueFor = 300;

    public function __construct(public int $prospectId) {}

    public function uniqueId(): string
    {
        return (string) $this->prospectId;
    }

    public function handle(ProspectMatchingService $matching): void
    {
        $prospect = Prospect::find($this->prospectId);

        // Converti en client ou supprimé entre-temps : plus rien à suggérer.
        if ($prospect && $prospect->client_id === null && ! $matching->refreshForProspect($prospect)) {
            // IA indisponible ou saturée : on reprend plus tard plutôt que
            // de laisser les anciennes suggestions indéfiniment.
            $this->release(120);
        }
    }
}
