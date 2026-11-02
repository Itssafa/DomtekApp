<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\Prospect;

/**
 * Mise en forme du prospect et des biens pour l'analyse IA.
 *
 * Aucun score n'est calculé ici : c'est l'IA qui juge l'adéquation
 * (SuggestionIaService). Ce service ne fait que décrire, de façon fidèle et
 * sans donnée personnelle superflue (ni nom, ni CIN, ni contact), ce que
 * l'IA doit savoir.
 */
class ProfilProspectService
{
    /** Bornes de chaque tranche de revenu mensuel (DT). */
    private const TRANCHES_REVENUS = [
        'moins_1000'  => [500, 1_000],
        '1000_2000'   => [1_000, 2_000],
        '3000_6000'   => [3_000, 6_000],
        '7000_10000'  => [7_000, 10_000],
        'plus_10000'  => [10_000, 15_000],
    ];

    /**
     * Repères de capacité de paiement donnés à l'IA comme contexte (elle reste
     * seule juge) : loyer d'environ 40 % du revenu ; achat financé par un
     * crédit de 20 ans dont la mensualité reste sous 40 % du revenu, soit à
     * peu près 100 mois de revenu.
     */
    private function capacite(string $tranche): ?string
    {
        if (! isset(self::TRANCHES_REVENUS[$tranche])) {
            return null;
        }
        [$min, $max] = self::TRANCHES_REVENUS[$tranche];
        $fmt = fn (float $v) => number_format($v, 0, ',', ' ');

        return "revenu mensuel de {$fmt($min)} à {$fmt($max)} DT ; loyer supportable d'environ "
            . "{$fmt($min * 0.4)} à {$fmt($max * 0.4)} DT/mois ; prix d'achat finançable à crédit "
            . "d'environ {$fmt($min * 100)} à {$fmt($max * 100)} DT";
    }

    public function descriptionPourIa(Prospect $prospect, array $biensInteret = []): string
    {
        $foyer = (array) ($prospect->composition_foyer ?? []);

        $lignes = [
            '- Civilité : ' . ($prospect->civilite ?: 'non précisée')
                . ' (Mme = femme mariée, Mlle = femme non mariée, M. = homme)',
            '- Âge : ' . ($prospect->date_naissance ? $prospect->date_naissance->age . ' ans' : 'non précisé'),
            '- Profession : ' . ($prospect->profession ?: 'non précisée'),
            '- Moyens : ' . ($this->capacite((string) $prospect->revenus_mensuels) ?? 'revenu non précisé'),
            '- Enfants : ' . (in_array('enfants', $foyer, true) ? 'oui' : 'non'),
            '- Animaux : ' . (in_array('animaux', $foyer, true) ? 'oui' : 'non'),
            '- Ville : ' . ($prospect->ville ?: 'non précisée'),
            '- Priorités : ' . (implode(', ', (array) ($prospect->hierarchie_besoins ?? [])) ?: 'non précisées'),
        ];

        if ($biensInteret) {
            $lignes[] = '- Biens qui l\'intéressent déjà : ' . json_encode($biensInteret, JSON_UNESCAPED_UNICODE);
        }

        return implode("\n", $lignes);
    }

    /** Caractéristiques d'un bien utiles à l'appariement. */
    public function bienPourIa(Bien $b): array
    {
        return [
            'id'               => $b->id,
            'type'             => $b->type_bien,
            'transaction'      => $b->type_transaction === 'loyer' ? 'location' : 'vente',
            'prix'             => (float) $b->prix . ($b->type_transaction === 'loyer' ? ' DT/mois' : ' DT'),
            'meuble'           => $b->type_location === 'meuble',
            'ville'            => $b->ville,
            'superficie_m2'    => $b->superficie,
            'chambres'         => $b->nb_chambres,
            'pieces'           => $b->nb_pieces,
            'animaux_acceptes' => (bool) $b->accepte_animaux,
            'fumeurs_acceptes' => (bool) $b->accepte_fumeurs,
            'options'          => array_values((array) ($b->options ?? [])),
        ];
    }
}
