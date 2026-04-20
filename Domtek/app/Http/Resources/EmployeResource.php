<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'user_id'         => $this->user_id,
            'nom'             => $this->nom,
            'prenom'          => $this->prenom,
            'nom_complet'     => $this->prenom . ' ' . $this->nom,
            'email'           => $this->email,
            'telephone'       => $this->telephone,
            'poste'           => $this->poste,
            'statut'          => $this->statut,
            'date_embauche'   => $this->date_embauche?->format('Y-m-d'),
            'date_naissance'  => $this->date_naissance?->format('Y-m-d'),
            'cin'             => $this->cin,
            'cin_delivree_le' => $this->cin_delivree_le?->format('Y-m-d'),
            'cin_delivree_a'  => $this->cin_delivree_a,
            'created_at'      => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'      => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
