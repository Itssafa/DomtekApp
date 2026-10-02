<?php

namespace App\Http\Resources\Espace;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Contrat vu par le client dans son espace.
 *
 * On expose les termes qui le concernent — durée, montants, modalités de
 * paiement, bien loué, coordonnées de l'agence — et rien de la mécanique
 * interne de celle-ci.
 */
class ContratResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'designation'          => $this->designation,
            'type'                 => $this->type,
            'statut'               => $this->statut,
            'utilisation'          => $this->utilisation,
            'date_debut'           => $this->date_debut?->format('Y-m-d'),
            'date_fin'             => $this->date_fin?->format('Y-m-d'),

            'montant_ht'           => $this->montant_ht !== null ? (float) $this->montant_ht : null,
            'tva'                  => $this->tva !== null ? (float) $this->tva : null,
            'montant_ttc'          => $this->montant_ttc !== null ? (float) $this->montant_ttc : null,
            'depot_garantie'       => $this->depot_garantie !== null ? (float) $this->depot_garantie : null,
            'periodicite_paiement' => $this->periodicite_paiement,
            'jour_paiement'        => $this->jour_paiement,

            'bien'                 => $this->whenLoaded('bien', fn () => [
                'id'          => $this->bien->id,
                'designation' => $this->bien->designation,
                'type_bien'   => $this->bien->type_bien,
                'adresse'     => $this->bien->adresse,
                'ville'       => $this->bien->ville,
                'superficie'  => $this->bien->superficie,
                'nb_pieces'   => $this->bien->nb_pieces,
                'image'       => $this->bien->relationLoaded('imagePrincipale') && $this->bien->imagePrincipale
                    ? asset('storage/' . $this->bien->imagePrincipale->chemin)
                    : null,
            ]),

            // Coordonnées de l'agence : c'est l'interlocuteur du client.
            'organisation'         => $this->whenLoaded('organisation', fn () => [
                'nom'       => $this->organisation->nom,
                'telephone' => $this->organisation->telephone,
                'email'     => $this->organisation->email,
                'adresse'   => $this->organisation->adresse,
                'ville'     => $this->organisation->ville,
            ]),

            'factures'             => FactureResource::collection($this->whenLoaded('factures')),
            'etats_lieux'          => EtatLieuResource::collection($this->whenLoaded('etatsLieux')),
        ];
    }
}
