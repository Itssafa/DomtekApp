<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContratResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'type'             => $this->type,
            'statut'           => $this->statut,
            'montant'          => $this->montant,
            'date_debut'       => $this->date_debut->format('Y-m-d'),
            'date_fin'         => $this->date_fin?->format('Y-m-d'),
            'fichier'          => $this->fichier,
            'notes'            => $this->notes,
            'forme_juridique'  => $this->forme_juridique,
            'representant'     => $this->representant,
            'date_contrat'     => $this->date_contrat?->format('Y-m-d'),
            'ville_signature'  => $this->ville_signature,
            'cin_delivree_le'  => $this->cin_delivree_le?->format('Y-m-d'),
            'bien'             => new BienResource($this->whenLoaded('bien')),
            'clients'          => ClientResource::collection($this->whenLoaded('clients')),
            'factures'         => FactureResource::collection($this->whenLoaded('factures')),
            'created_at'       => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'       => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
