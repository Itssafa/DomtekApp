<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BienResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'immeuble_id'      => $this->immeuble_id,
            'bloc'             => $this->bloc,
            'immeuble'         => new ImmeubleResource($this->whenLoaded('immeuble')),
            'titre'            => $this->titre,
            'description'      => $this->description,
            'type_transaction' => $this->type_transaction,
            'type_bien'        => $this->type_bien,
            'prix'             => $this->prix,
            'superficie'       => $this->superficie,
            'adresse'          => $this->adresse,
            'ville'            => $this->ville,
            'nb_pieces'        => $this->nb_pieces,
            'nb_chambres'      => $this->nb_chambres,
            'nb_salles_bain'   => $this->nb_salles_bain,
            'etage'            => $this->etage,
            'statut'           => $this->statut,
            'image_principale' => new BienImageResource(
                $this->whenLoaded('imagePrincipale') ?? $this->images?->first()
            ),
            'images'           => BienImageResource::collection($this->whenLoaded('images')),
            'organisation'     => new OrganisationResource($this->whenLoaded('organisation')),
            'created_at'       => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'       => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
