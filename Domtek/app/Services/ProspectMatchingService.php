<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\Prospect;
use App\Models\ProspectSuggestion;
use Illuminate\Support\Collection;

class ProspectMatchingService
{
    public function __construct(private ProfilProspectService $profil) {}

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
            'accepte_animaux', 'options', 'nb_pieces', 'nb_chambres',
        ]);

        // Un bien que le prospect ne peut pas payer n'est jamais suggéré.
        $biens = $biens->reject(fn (Bien $b) => $this->profil->estSolvable($b, $prospect) === false);

        // Profil de référence
        [$refPrix, $refTypes, $refTransaction, $refVilles] = $this->extractProfile($prospect, $refIds);

        $hasProfile = $refPrix || $refTypes || $refVilles || $refTransaction
            || $prospect->revenus_mensuels || $prospect->profession;

        // Calculer les scores ; si le prospect n'a aucun critère connu,
        // on lui attribue un score de base 30 (disponibilité seule)
        $rows = $biens->map(function (Bien $b) use ($orgId, $prospect, $refPrix, $refTypes, $refTransaction, $refVilles, $hasProfile) {
            $computed = $this->computeScore($b, $refPrix, $refTypes, $refTransaction, $refVilles, $prospect);
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

        if (!$refVilles && $prospect->ville) {
            $refVilles = [$prospect->ville];
        }

        return [$refPrix, $refTypes, $refTransaction, $refVilles];
    }

    private function computeScore(Bien $bien, ?float $refPrix, array $refTypes, ?string $refTransaction, array $refVilles, Prospect $prospect): int
    {
        $score = 0;

        // Type de transaction (15 pts) — bonus si correspond, pas d'élimination
        if ($refTransaction && $bien->type_transaction === $refTransaction) {
            $score += 15;
        }

        // Prix proche des biens qui l'intéressent (20 pts)
        if ($refPrix && $bien->prix) {
            $ratio = abs((float) $bien->prix - $refPrix) / $refPrix;
            if ($ratio <= 0.20)     $score += 20;
            elseif ($ratio <= 0.30) $score += 12;
            elseif ($ratio <= 0.40) $score += 6;
        }

        // Solvabilité (20 pts) : dans son budget d'après ses revenus.
        // Les biens hors budget ont déjà été écartés en amont.
        if ($this->profil->estSolvable($bien, $prospect) === true) {
            $score += 20;
        }

        // Type de bien (20 pts)
        if ($refTypes && in_array($bien->type_bien, $refTypes)) {
            $score += 20;
        }

        // Ville exacte (22 pts)
        if ($refVilles && $bien->ville) {
            $bienVille = mb_strtolower(trim($bien->ville));
            foreach ($refVilles as $v) {
                if (mb_strtolower(trim($v)) === $bienVille) {
                    $score += 22;
                    break;
                }
            }
        }

        // Options en commun (3 pts)
        $bienOptions = (array) ($bien->options ?? []);
        $hierarchie  = $prospect->hierarchie_besoins ?? [];
        if (in_array('commodites', $hierarchie) && count($bienOptions) >= 3) {
            $score += 3;
        }

        // Cohérence avec son profil (-40 à +40) : profession, enfants, civilité, animaux.
        $score += $this->profil->coherence($bien, $prospect)['points'];

        return max(0, min(100, $score));
    }
}
