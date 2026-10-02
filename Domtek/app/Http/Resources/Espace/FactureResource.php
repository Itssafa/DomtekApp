<?php

namespace App\Http\Resources\Espace;

use App\Models\Facture;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Facture vue par le client dans son espace.
 *
 * Volontairement plus étroite que la ressource du back-office : les champs
 * internes à l'agence (notes, colonnes d'audit, identifiant Stripe) n'ont pas
 * à sortir ici.
 */
class FactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $impayee = $this->statut !== Facture::STATUT_PAYEE;

        return [
            'id'            => $this->id,
            'reference'     => $this->reference,
            'type'          => $this->type,
            'montant'       => (float) $this->montant,
            'statut'        => $this->statut,
            'date_emission' => $this->date_emission?->format('Y-m-d'),
            'date_echeance' => $this->date_echeance?->format('Y-m-d'),
            'periode_debut' => $this->periode_debut?->format('Y-m-d'),
            'periode_fin'   => $this->periode_fin?->format('Y-m-d'),

            // Lien de règlement en ligne, uniquement tant que la facture est due.
            // Même URL publique que celle envoyée par e-mail : c'est le jeton
            // qui identifie la facture, le client n'a rien à saisir.
            'payment_url'   => $impayee && $this->payment_token
                ? config('app.url') . '/api/pay/' . $this->payment_token
                : null,

            'organisation'  => $this->whenLoaded('organisation', fn () => [
                'nom'       => $this->organisation->nom,
                'telephone' => $this->organisation->telephone,
                'email'     => $this->organisation->email,
            ]),

            'contrat'       => $this->whenLoaded('contrat', fn () => [
                'id'          => $this->contrat->id,
                'designation' => $this->contrat->designation,
                'bien'        => $this->contrat->relationLoaded('bien') && $this->contrat->bien
                    ? [
                        'designation' => $this->contrat->bien->designation,
                        'adresse'     => $this->contrat->bien->adresse,
                        'ville'       => $this->contrat->bien->ville,
                    ]
                    : null,
            ]),
        ];
    }
}
