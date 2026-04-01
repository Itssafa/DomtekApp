<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProspectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'client_id'          => $this->client_id,
            'converti'           => $this->client_id !== null,
            'civilite'           => $this->civilite,
            'nom'                => $this->nom,
            'prenom'             => $this->prenom,
            'nom_complet'        => trim(($this->civilite ? $this->civilite . ' ' : '') . $this->prenom . ' ' . $this->nom),
            'email'              => $this->email,
            'telephone'          => $this->telephone,
            'adresse'            => $this->adresse,
            'ville'              => $this->ville,
            'date_naissance'     => $this->date_naissance?->format('Y-m-d'),
            'lieu_naissance'     => $this->lieu_naissance,
            'type_piece'         => $this->type_piece,
            'cin'                => $this->cin,
            'document_url'       => $this->document_identite
                                     ? asset('storage/' . $this->document_identite)
                                     : null,
            'notes'              => $this->notes,
            // Profil prospect
            'profession'         => $this->profession,
            'revenus_mensuels'   => $this->revenus_mensuels,
            'composition_foyer'  => $this->composition_foyer ?? [],
            'biens_interet'      => $this->biens_interet ?? [],
            'score_solvabilite'          => $this->score_solvabilite,
            'impression_premiere_visite' => $this->impression_premiere_visite,
            'hierarchie_besoins'         => $this->hierarchie_besoins ?? [],
            // Score calculé
            'score_opportunite'  => $this->scoreOpportunite(),
            // Relations
            'created_at'         => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'         => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
