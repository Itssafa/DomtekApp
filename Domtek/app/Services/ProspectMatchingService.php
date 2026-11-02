<?php

namespace App\Services;

use App\Jobs\RafraichirSuggestionsProspect;
use App\Models\Bien;
use App\Models\Prospect;
use App\Models\ProspectSuggestion;

/**
 * Suggestions prospect ↔ bien enregistrées (tableau de bord).
 *
 * Elles sont choisies par l'IA (SuggestionIaService), comme sur la fiche
 * prospect. L'appel IA prenant plusieurs secondes, le recalcul passe par la
 * file d'attente : enregistrer un bien ou un prospect reste instantané.
 */
class ProspectMatchingService
{
    public function __construct(private SuggestionIaService $ia) {}

    /**
     * Recalcule et enregistre les suggestions d'un prospect.
     *
     * Si l'IA ne répond pas, les suggestions précédentes sont conservées
     * plutôt qu'effacées, et la méthode renvoie false.
     */
    public function refreshForProspect(Prospect $prospect): bool
    {
        $suggestions = $this->ia->suggerer($prospect);
        if ($suggestions === null) {
            return false;
        }

        ProspectSuggestion::where('prospect_id', $prospect->id)->delete();

        $lignes = array_map(fn ($s) => [
            'organisation_id' => $prospect->organisation_id,
            'prospect_id'     => $prospect->id,
            'bien_id'         => $s['bien']->id,
            'score'           => $s['score'],
            'raison'          => $s['raison'],
            'created_at'      => now(),
            'updated_at'      => now(),
        ], $suggestions);

        if ($lignes) {
            ProspectSuggestion::insert($lignes);
        }

        return true;
    }

    /** Demande le recalcul d'un prospect, en arrière-plan. */
    public function planifierPourProspect(Prospect $prospect): void
    {
        if ($prospect->client_id === null) {
            RafraichirSuggestionsProspect::dispatch($prospect->id);
        }
    }

    /**
     * Un bien a changé : les suggestions de tous les prospects de l'agence
     * peuvent en être affectées.
     */
    public function refreshForBien(Bien $bien): void
    {
        Prospect::where('organisation_id', $bien->organisation_id)
            ->whereNull('client_id')
            ->pluck('id')
            ->each(fn ($id) => RafraichirSuggestionsProspect::dispatch($id));
    }

    /**
     * Supprime toutes les suggestions liées à un bien supprimé.
     * (Géré par la FK cascade mais explicite pour la lisibilité.)
     */
    public function deleteForBien(int $bienId): void
    {
        ProspectSuggestion::where('bien_id', $bienId)->delete();
    }
}
