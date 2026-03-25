<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganisationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'nom'         => $this->nom,
            'slug'        => $this->slug,
            'statut'      => $this->statut,
            'logo'        => $this->logo,
            'adresse'     => $this->adresse,
            'ville'       => $this->ville,
            'telephone'   => $this->telephone,
            'email'       => $this->email,
            'description' => $this->description,
            'user'        => new UserResource($this->whenLoaded('user')),
            'biens_count'    => $this->whenCounted('biens'),
            'annonces_count' => $this->whenCounted('annonces'),
            'clients_count'  => $this->whenCounted('clients'),
            'created_at'  => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
