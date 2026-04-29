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
            'location'            => $this->whenLoaded('location', fn () => $this->location ? [
                'id'             => $this->location->id,
                'locataire_nom'  => $this->location->locataire_nom,
                'locataire_type' => $this->location->locataire_type,
                'type'           => $this->location->type,
                'date_debut'     => $this->location->date_debut?->toDateString(),
                'bien'           => $this->location->bien ? [
                    'id'          => $this->location->bien->id,
                    'designation' => $this->location->bien->designation,
                    'ville'       => $this->location->bien->ville,
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
