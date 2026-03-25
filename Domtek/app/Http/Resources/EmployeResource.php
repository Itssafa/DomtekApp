<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'nom'            => $this->nom,
            'prenom'         => $this->prenom,
            'nom_complet'    => $this->prenom . ' ' . $this->nom,
            'email'          => $this->email,
            'telephone'      => $this->telephone,
            'poste'          => $this->poste,
            'statut'         => $this->statut,
            'date_embauche'  => $this->date_embauche?->format('Y-m-d'),
            'created_at'     => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'     => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
