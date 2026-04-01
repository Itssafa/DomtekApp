<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VisiteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'nom_agent'        => $this->nom_agent,
            'date_visite'      => $this->date_visite?->toDateTimeString(),
            'statut'           => $this->statut,
            'impression_client'=> $this->impression_client,
            'notes'            => $this->notes,
            'prospect'    => $this->whenLoaded('prospect', fn () => [
                'id'         => $this->prospect->id,
                'nom_complet'=> $this->prospect->nom_complet,
                'telephone'  => $this->prospect->telephone,
            ]),
            'client'      => $this->whenLoaded('prospect', fn () => [
                'id'         => $this->prospect->id,
                'nom_complet'=> $this->prospect->nom_complet,
                'telephone'  => $this->prospect->telephone,
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
