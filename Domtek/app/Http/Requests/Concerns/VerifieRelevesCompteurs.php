<?php

namespace App\Http\Requests\Concerns;

use App\Models\EtatLieu;
use Illuminate\Validation\Validator;

/**
 * Un compteur ne recule pas : les relevés d'un état des lieux de sortie ne
 * peuvent pas être inférieurs à ceux de l'entrée correspondante.
 *
 * Sans ce contrôle, la régularisation des charges repose sur une consommation
 * négative — un calcul faux que le locataire n'a aucun moyen de contester.
 *
 * Choix métier retenu : en l'absence d'état des lieux d'entrée, la sortie est
 * acceptée sans contrôle. Les baux antérieurs à la mise en place du module
 * n'en ont pas, et refuser leur sortie bloquerait des dossiers légitimes.
 */
trait VerifieRelevesCompteurs
{
    /** Libellés porteurs de leur préposition : « relevé d'eau », « relevé de gaz ». */
    private const COMPTEURS = [
        'releve_eau'         => "d'eau",
        'releve_electricite' => "d'électricité",
        'releve_gaz'         => 'de gaz',
    ];

    /**
     * @param EtatLieu|null $courant L'enregistrement en cours de modification,
     *                               d'où sont reprises les valeurs non soumises.
     */
    protected function verifierReleves(Validator $v, ?EtatLieu $courant = null): void
    {
        if ($this->input('type', $courant?->type) !== 'sortie') {
            return;
        }

        $contratId  = $this->input('contrat_id',  $courant?->contrat_id);
        $locationId = $this->input('location_id', $courant?->location_id);

        if (! $contratId && ! $locationId) {
            return;
        }

        $entree = EtatLieu::where('type', 'entree')
            ->when($contratId,  fn ($q) => $q->where('contrat_id', $contratId))
            ->when($locationId, fn ($q) => $q->where('location_id', $locationId))
            ->when($courant,    fn ($q) => $q->whereKeyNot($courant->getKey()))
            ->latest('date')
            ->first();

        if (! $entree) {
            return;
        }

        foreach (self::COMPTEURS as $champ => $libelle) {
            if (! $this->filled($champ) || $entree->$champ === null) {
                continue;
            }

            $sortie  = (float) $this->input($champ);
            $initial = (float) $entree->$champ;

            if ($sortie < $initial) {
                $v->errors()->add($champ, sprintf(
                    'Le relevé %s à la sortie (%s) ne peut pas être inférieur à celui de '
                    . "l'entrée du %s (%s).",
                    $libelle,
                    rtrim(rtrim(number_format($sortie, 3, ',', ' '), '0'), ','),
                    $entree->date?->format('d/m/Y') ?? '—',
                    rtrim(rtrim(number_format($initial, 3, ',', ' '), '0'), ','),
                ));
            }
        }
    }
}
