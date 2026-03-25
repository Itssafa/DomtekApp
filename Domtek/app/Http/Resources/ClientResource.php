<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'civilite'          => $this->civilite,
            'nom'               => $this->nom,
            'prenom'            => $this->prenom,
            'nom_complet'       => trim(($this->civilite ? $this->civilite . ' ' : '') . $this->prenom . ' ' . $this->nom),
            'email'             => $this->email,
            'telephone'         => $this->telephone,
            'adresse'           => $this->adresse,
            'ville'             => $this->ville,
            'date_naissance'    => $this->date_naissance?->format('Y-m-d'),
            'lieu_naissance'    => $this->lieu_naissance,
            'type_piece'        => $this->type_piece,
            'cin'               => $this->cin,
            'document_url'      => $this->document_identite
                                    ? asset('storage/' . $this->document_identite)
                                    : null,
            'urgence_nom'       => $this->urgence_nom,
            'urgence_telephone' => $this->urgence_telephone,
            'urgence_relation'  => $this->urgence_relation,
            'notes'             => $this->notes,
            'contrats'          => ContratResource::collection($this->whenLoaded('contrats')),
            'factures'          => FactureResource::collection($this->whenLoaded('factures')),
            'created_at'        => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'        => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
