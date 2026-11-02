<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\Prospect;

/**
 * Adéquation entre le profil d'un prospect et un bien.
 *
 * Deux questions distinctes :
 *  1. Solvabilité — le prospect peut-il payer ce bien ? Le loyer est comparé
 *     à ses revenus mensuels, le prix de vente à sa capacité d'emprunt.
 *  2. Cohérence — le bien correspond-il à sa vie ? Un cabinet pour un médecin,
 *     un terrain ou une ferme pour un agriculteur, un S+3 pour une famille
 *     avec enfants plutôt que pour une personne seule…
 *
 * Ces règles servent à la fois au calcul automatique des suggestions
 * (ProspectMatchingService) et de pré-filtre / contexte à l'analyse IA
 * (ProspectSuggestionsController), pour que les deux restent cohérents.
 */
class ProfilProspectService
{
    /** Revenu mensuel retenu pour chaque tranche (milieu de tranche, en DT). */
    private const REVENU_MENSUEL = [
        'moins_1000'  => 800,
        '1000_2000'   => 1_500,
        '3000_6000'   => 4_500,
        '7000_10000'  => 8_500,
        'plus_10000'  => 12_000,
    ];

    /** Part du revenu qu'un loyer peut raisonnablement absorber. */
    private const TAUX_EFFORT_LOYER = 0.40;

    /** Prix d'achat finançable : environ 100 mois de revenu (crédit sur ~20 ans). */
    private const MOIS_REVENU_ACHAT = 100;

    /** Biens d'habitation, par opposition aux biens professionnels ou agricoles. */
    private const HABITATION = ['appartement', 'maison', 'villa', 'studio', 'duplex'];

    /** Types de biens adaptés à chaque profession (liste du formulaire prospect). */
    private const BIENS_PAR_PROFESSION = [
        'Médecin / Dentiste'        => ['bureau', 'local_commercial'],
        'Avocat / Notaire'          => ['bureau'],
        'Architecte'                => ['bureau'],
        'Profession libérale'       => ['bureau', 'local_commercial'],
        'Commerçant / Entrepreneur' => ['local_commercial', 'entrepot', 'bureau'],
        'Agriculteur'               => ['terrain', 'ferme'],
    ];

    /** Libellé lisible du local professionnel attendu, pour les explications. */
    private const LOCAL_PAR_PROFESSION = [
        'Médecin / Dentiste'        => 'un cabinet',
        'Avocat / Notaire'          => 'un cabinet ou un bureau',
        'Architecte'                => 'un bureau',
        'Profession libérale'       => 'un cabinet ou un bureau',
        'Commerçant / Entrepreneur' => 'un local commercial ou un entrepôt',
        'Agriculteur'               => 'un terrain ou une ferme',
    ];

    public function revenuMensuel(Prospect $prospect): ?int
    {
        return self::REVENU_MENSUEL[$prospect->revenus_mensuels] ?? null;
    }

    /**
     * Montant maximal supportable : loyer mensuel pour une location, prix
     * d'achat pour une vente. Null si les revenus ne sont pas renseignés.
     */
    public function budgetMax(Prospect $prospect, string $transaction): ?float
    {
        $revenu = $this->revenuMensuel($prospect);
        if (! $revenu) {
            return null;
        }

        return $transaction === 'loyer'
            ? $revenu * self::TAUX_EFFORT_LOYER
            : $revenu * self::MOIS_REVENU_ACHAT;
    }

    /**
     * Le prospect peut-il payer ce bien ? Null quand on ne peut pas le savoir
     * (revenus ou prix non renseignés) : on ne pénalise pas l'inconnu.
     */
    public function estSolvable(Bien $bien, Prospect $prospect): ?bool
    {
        $max = $this->budgetMax($prospect, (string) $bien->type_transaction);
        if (! $max || ! $bien->prix) {
            return null;
        }

        return (float) $bien->prix <= $max;
    }

    /**
     * Cohérence du bien avec la vie du prospect.
     *
     * @return array{points: int, raisons: list<string>, alertes: list<string>}
     *   `points` entre -40 et +40 ; `raisons` (atouts) et `alertes` (réserves)
     *   sont des phrases courtes destinées à l'agent.
     */
    public function coherence(Bien $bien, Prospect $prospect): array
    {
        $points  = 0;
        $raisons = [];
        $alertes = [];

        $type       = (string) $bien->type_bien;
        $habitation = in_array($type, self::HABITATION, true);
        $profession = (string) $prospect->profession;
        $foyer      = (array) ($prospect->composition_foyer ?? []);
        $enfants    = in_array('enfants', $foyer, true);
        $animaux    = in_array('animaux', $foyer, true);
        $civilite   = (string) $prospect->civilite;
        $chambres   = $this->chambres($bien);

        // ── Profession ────────────────────────────────────────────────────
        $adaptes = self::BIENS_PAR_PROFESSION[$profession] ?? null;
        if ($adaptes && in_array($type, $adaptes, true)) {
            $points += 25;
            $raisons[] = "Adapté à sa profession ({$profession}) : " . self::LOCAL_PAR_PROFESSION[$profession];
        } elseif (! $habitation && $type !== 'autre') {
            // Bien professionnel ou agricole pour quelqu'un dont le métier n'en
            // a pas l'usage (étudiant, salarié, retraité…).
            $points -= 25;
            $alertes[] = 'Bien professionnel ou agricole sans rapport avec sa profession'
                . ($profession !== '' ? " ({$profession})" : '');
        }

        if ($profession === 'Étudiant' && $habitation) {
            if ($type === 'studio' || ($chambres !== null && $chambres <= 1)) {
                $points += 10;
                $raisons[] = 'Petit logement adapté à un étudiant';
            } elseif (in_array($type, ['villa', 'duplex'], true) || ($chambres !== null && $chambres >= 3)) {
                $points -= 15;
                $alertes[] = 'Logement grand pour un étudiant';
            }
        }

        // ── Composition du foyer (logements seulement) ────────────────────
        if ($habitation) {
            $grand = in_array($type, ['villa', 'maison', 'duplex'], true) || ($chambres !== null && $chambres >= 3);
            $petit = $type === 'studio' || ($chambres !== null && $chambres <= 1);
            // Mme / M. avec enfants : famille. Mlle, ou sans enfants : personne seule ou couple.
            $famille = $enfants && in_array($civilite, ['Mme', 'M.'], true);

            if ($grand && $famille) {
                $points += 15;
                $raisons[] = 'Logement familial (S+3 ou plus) pour un foyer avec enfants';
            } elseif ($grand && ! $enfants) {
                $points -= 10;
                $alertes[] = 'Logement familial pour un foyer sans enfants';
            }

            if ($petit && $enfants) {
                $points -= 20;
                $alertes[] = 'Trop petit pour un foyer avec enfants';
            } elseif ($petit && ! $enfants && $civilite === 'Mlle') {
                $points += 5;
                $raisons[] = 'Petit logement adapté à une personne seule';
            }

            if ($animaux) {
                if ($bien->accepte_animaux) {
                    $points += 5;
                    $raisons[] = 'Animaux acceptés';
                } else {
                    $points -= 10;
                    $alertes[] = "N'accepte pas les animaux";
                }
            }
        }

        return [
            'points'  => max(-40, min(40, $points)),
            'raisons' => $raisons,
            'alertes' => $alertes,
        ];
    }

    /**
     * Description du prospect pour l'analyse IA. Le nom n'y figure pas :
     * seules les caractéristiques utiles à l'appariement sont transmises.
     */
    public function descriptionPourIa(Prospect $prospect): string
    {
        $foyer = (array) ($prospect->composition_foyer ?? []);
        $revenu = $this->revenuMensuel($prospect);

        return implode("\n", [
            '- Civilité : ' . ($prospect->civilite ?: 'non précisée')
                . ' (Mme = femme mariée, Mlle = femme non mariée, M. = homme)',
            '- Profession : ' . ($prospect->profession ?: 'non précisée'),
            '- Enfants : ' . (in_array('enfants', $foyer, true) ? 'oui' : 'non'),
            '- Animaux : ' . (in_array('animaux', $foyer, true) ? 'oui' : 'non'),
            '- Revenu mensuel estimé : ' . ($revenu ? $revenu . ' DT' : 'non précisé'),
            '- Loyer maximal supportable : ' . ($revenu ? round($revenu * self::TAUX_EFFORT_LOYER) . ' DT/mois' : 'non précisé'),
            '- Prix d\'achat maximal finançable : ' . ($revenu ? ($revenu * self::MOIS_REVENU_ACHAT) . ' DT' : 'non précisé'),
            '- Ville : ' . ($prospect->ville ?: 'non précisée'),
            '- Priorités : ' . (implode(', ', (array) ($prospect->hierarchie_besoins ?? [])) ?: 'non précisées'),
        ]);
    }

    /** Nombre de chambres : champ dédié, sinon déduit des pièces (S+n = n+1 pièces). */
    private function chambres(Bien $bien): ?int
    {
        if ($bien->nb_chambres !== null && $bien->nb_chambres !== '') {
            return (int) $bien->nb_chambres;
        }
        if ($bien->nb_pieces !== null && $bien->nb_pieces !== '') {
            return max(0, (int) $bien->nb_pieces - 1);
        }

        return null;
    }
}
