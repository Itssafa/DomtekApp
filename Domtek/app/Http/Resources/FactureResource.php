<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'type'           => $this->type,
            'montant'        => $this->montant,
            'statut'         => $this->statut,
            'reference'      => $this->reference,
            'date_emission'  => $this->date_emission->format('Y-m-d'),
            'date_echeance'  => $this->date_echeance->format('Y-m-d'),
            'notes'          => $this->notes,
            'client'         => new ClientResource($this->whenLoaded('client')),
            'contrat'        => new ContratResource($this->whenLoaded('contrat')),
            'created_at'     => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'     => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
