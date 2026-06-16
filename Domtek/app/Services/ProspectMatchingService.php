<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\Prospect;
use App\Models\ProspectSuggestion;
use Illuminate\Support\Collection;

class ProspectMatchingService
{
    private const REVENUS_BUDGET = [
        'moins_1000'  => 80_000,
        '1000_2000'   => 150_000,
        '3000_6000'   => 300_000,
        '7000_10000'  => 500_000,
        'plus_10000'  => 800_000,
    ];

    /**
     * Recalcule et persiste les suggestions pour un prospect donné
     * en utilisant uniquement le scoring rule-based (sans IA externe).
     */
    public function refreshForProspect(Prospect $prospect): void
    {
        $orgId = $prospect->organisation_id;

        // Biens disponibles de la même org sans contrat actif
        $refIds = array_values(array_filter((array) ($prospect->biens_interet ?? [])));

        $query = Bien::where('organisation_id', $orgId)
            ->where('statut', 'disponible')
            ->whereDoesntHave('contrats', fn($q) => $q->where('statut', 'actif'));

        if ($refIds) $query->whereNotIn('id', $refIds);

        $biens = $query->get([
            'id', 'type_bien', 'type_transaction', 'prix', 'ville',
            'accepte_animaux', 'options',
        ]);

        // Profil de référence
        [$refPrix, $refTypes, $refTransaction, $refVilles] = $this->extractProfile($prospect, $refIds);

        if ($refTransaction) {
            $biens = $biens->where('type_transaction', $refTransaction);
        }

        $hasProfile = $refPrix || $refTypes || $refVilles;

        // Calculer les scores ; si le prospect n'a aucun critère connu,
        // on lui attribue un score de base 30 (disponibilité seule)
        $rows = $biens->map(function (Bien $b) use ($orgId, $prospect, $refPrix, $refTypes, $refVilles, $hasProfile) {
            $computed = $this->computeScore($b, $refPrix, $refTypes, $refVilles, $prospect);
            $score    = $hasProfile ? $computed : max($computed, 30);
            return [
                'organisation_id' => $orgId,
                'prospect_id'     => $prospect->id,
                'bien_id'         => $b->id,
                'score'           => $score,
            ];
        })->sortByDesc('score')->take(5)->values();

        // Remplacer les anciennes suggestions de ce prospect
        ProspectSuggestion::where('prospect_id', $prospect->id)->delete();

        if ($rows->isNotEmpty()) {
            ProspectSuggestion::insert($rows->toArray());
        }
    }

    /**
     * Recalcule les suggestions pour tous les prospects de l'org
     * qui pourraient être affectés par un changement sur un bien.
     */
    public function refreshForBien(Bien $bien): void
    {
        $prospects = Prospect::where('organisation_id', $bien->organisation_id)
            ->whereNull('client_id')
            ->get();

        foreach ($prospects as $prospect) {
            $this->refreshForProspect($prospect);
        }
    }

    /**
     * Supprime toutes les suggestions liées à un bien supprimé.
     * (Géré par la FK cascade mais explicite pour la lisibilité.)
     */
    public function deleteForBien(int $bienId): void
    {
        ProspectSuggestion::where('bien_id', $bienId)->delete();
    }

    // ── Helpers privés ──────────────────────────────────────────────────────────

    private function extractProfile(Prospect $prospect, array $refIds): array
    {
        $refBiens = $refIds ? Bien::whereIn('id', $refIds)->get() : collect();

        $refPrix        = $refBiens->avg('prix');
        $refTypes       = $refBiens->pluck('type_bien')->filter()->unique()->values()->toArray();
        $refTransaction = $refBiens->first()?->type_transaction;
        $refVilles      = $refBiens->pluck('ville')->filter()->unique()->values()->toArray();

        if (!$refPrix && $prospect->revenus_mensuels) {
            $refPrix = self::REVENUS_BUDGET[$prospect->revenus_mensuels] ?? null;
        }

        if (!$refVilles && $prospect->ville) {
            $refVilles = [$prospect->ville];
        }

        return [$refPrix, $refTypes, $refTransaction, $refVilles];
    }

    private function computeScore(Bien $bien, ?float $refPrix, array $refTypes, array $refVilles, Prospect $prospect): int
    {
        $score = 0;

        // Prix (40 pts)
        if ($refPrix && $bien->prix) {
            $ratio = abs((float) $bien->prix - $refPrix) / $refPrix;
            if ($ratio <= 0.20)     $score += 40;
            elseif ($ratio <= 0.30) $score += 25;
            elseif ($ratio <= 0.40) $score += 12;
        }

        // Type de bien (25 pts)
        if ($refTypes && in_array($bien->type_bien, $refTypes)) {
            $score += 25;
        }

        // Ville exacte (25 pts)
        if ($refVilles && $bien->ville) {
            $bienVille = mb_strtolower(trim($bien->ville));
            foreach ($refVilles as $v) {
                if (mb_strtolower(trim($v)) === $bienVille) {
                    $score += 25;
                    break;
                }
            }
        }

        // Animaux acceptés (5 pts)
        if ($bien->accepte_animaux && in_array('animaux', $prospect->composition_foyer ?? [])) {
            $score += 5;
        }

        // Options en commun (5 pts max)
        $bienOptions     = (array) ($bien->options ?? []);
        $hierarchie      = $prospect->hierarchie_besoins ?? [];
        if (in_array('commodites', $hierarchie) && count($bienOptions) >= 3) {
            $score += 5;
        }

        return min(100, $score);
    }
}
