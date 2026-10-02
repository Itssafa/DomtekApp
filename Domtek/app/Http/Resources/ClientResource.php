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
            'nom_complet'       => $this->nom_complet,
            'email'             => $this->email,
            'telephone'         => $this->telephone,
            'adresse'           => $this->adresse,
            'ville'             => $this->ville,
            'date_naissance'    => $this->date_naissance?->format('Y-m-d'),
            'lieu_naissance'    => $this->lieu_naissance,
            'type_piece'        => $this->type_piece,
            'cin'               => $this->cin,
            'cin_delivree_le'   => $this->cin_delivree_le?->format('Y-m-d'),
            'document_url'      => $this->document_identite
                                    ? asset('storage/' . $this->document_identite)
                                    : null,
            'urgence_nom'       => $this->urgence_nom,
            'urgence_telephone' => $this->urgence_telephone,
            'urgence_relation'  => $this->urgence_relation,
            'notes'             => $this->notes,

            // État de l'accès à l'espace client. Le mot de passe n'est jamais
            // exposé : l'agence sait seulement si le client a activé, ou non.
            //   aucun    → pas de compte (fiche sans e-mail)
            //   invite   → compte créé, invitation envoyée, pas encore activée
            //   actif    → le client a choisi son mot de passe
            'acces_statut'      => match (true) {
                $this->user_id === null                      => 'aucun',
                $this->user?->email_verified_at === null     => 'invite',
                default                                      => 'actif',
            },

            'contrats'          => ContratResource::collection($this->whenLoaded('contrats')),
            'factures'          => FactureResource::collection($this->whenLoaded('factures')),
            'created_at'        => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'        => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
