<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VisiteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'nom_agent'   => $this->nom_agent,
            'date_visite' => $this->date_visite?->toDateTimeString(),
            'statut'      => $this->statut,
            'notes'       => $this->notes,
            'client'      => $this->whenLoaded('client', fn () => [
                'id'         => $this->client->id,
                'nom_complet'=> $this->client->nom_complet,
                'telephone'  => $this->client->telephone,
            ]),
            'bien'        => $this->whenLoaded('bien', fn () => [
                'id'          => $this->bien->id,
                'designation' => $this->bien->designation,
                'type_bien'   => $this->bien->type_bien,
                'ville'       => $this->bien->ville,
            ]),
            'created_at'  => $this->created_at,
        ];
    }
}
