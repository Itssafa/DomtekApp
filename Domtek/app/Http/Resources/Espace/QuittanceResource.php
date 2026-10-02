<?php

namespace App\Http\Resources\Espace;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Quittance de loyer vue par le client.
 *
 * Le reste à payer est calculé ici plutôt que côté navigateur : c'est la
 * seule valeur qui décide si le client doit encore quelque chose.
 */
class QuittanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $montant = (float) $this->montant;
        $paye    = (float) ($this->montant_paye ?? 0);

        return [
            'id'            => $this->id,
            'periode'       => $this->periode,
            'date_echeance' => $this->date_echeance?->format('Y-m-d'),
            'date_paiement' => $this->date_paiement?->format('Y-m-d'),
            'montant'       => $montant,
            'montant_paye'  => $paye,
            'reste_a_payer' => round(max($montant - $paye, 0), 2),
            'statut'        => $this->statut,

            'location'      => $this->whenLoaded('location', fn () => [
                'id'          => $this->location->id,
                'designation' => $this->location->designation,
                'agence'      => $this->location->relationLoaded('organisation') && $this->location->organisation
                    ? $this->location->organisation->nom
                    : null,
                'bien'        => $this->location->relationLoaded('bien') && $this->location->bien
                    ? [
                        'designation' => $this->location->bien->designation,
                        'adresse'     => $this->location->bien->adresse,
                        'ville'       => $this->location->bien->ville,
                    ]
                    : null,
            ]),
        ];
    }
}
