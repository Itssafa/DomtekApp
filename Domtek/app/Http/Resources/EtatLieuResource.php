<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EtatLieuResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'designation'         => $this->designation,
            'type'                => $this->type,
            'date'                => $this->date?->toDateString(),
            'releve_eau'          => $this->releve_eau,
            'releve_electricite'  => $this->releve_electricite,
            'releve_gaz'          => $this->releve_gaz,
            'remise_cles'         => $this->remise_cles,
            'commentaire'         => $this->commentaire,
            'contrat'             => $this->whenLoaded('contrat', fn () => $this->contrat ? [
                'id'          => $this->contrat->id,
                'designation' => $this->contrat->designation,
                'type'        => $this->contrat->type,
                'date_debut'  => $this->contrat->date_debut?->toDateString(),
                'bien'        => $this->contrat->relationLoaded('bien') ? [
                    'id'          => $this->contrat->bien?->id,
                    'designation' => $this->contrat->bien?->designation,
                ] : null,
                'clients'     => $this->contrat->relationLoaded('clients')
                    ? $this->contrat->clients->map(fn ($c) => [
                        'id'          => $c->id,
                        'nom_complet' => $c->nom_complet,
                    ])
                    : null,
            ] : null),
            'location'            => $this->whenLoaded('location', fn () => $this->location ? [
                'id'            => $this->location->id,
                'locataire_nom' => $this->location->locataire_nom,
                'bien'          => $this->location->bien ? [
                    'id'          => $this->location->bien->id,
                    'designation' => $this->location->bien->designation,
                ] : null,
            ] : null),
            'inventaires'         => $this->whenLoaded('inventaires', fn () =>
                $this->inventaires->map(fn ($inv) => [
                    'id'          => $inv->id,
                    'piece'       => $inv->piece,
                    'categorie'   => $inv->categorie,
                    'designation' => $inv->designation,
                    'description' => $inv->description,
                    'date'        => $inv->date?->toDateString(),
                ])
            ),
            'created_at'          => $this->created_at,
            'updated_at'          => $this->updated_at,
        ];
    }
}
