<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'locataire_type'       => $this->locataire_type,
            'locataire_id'         => $this->locataire_id,
            'locataire_nom'        => $this->locataire_nom_display,
            'designation'          => $this->designation,
            'type'                 => $this->type,
            'utilisation'          => $this->utilisation,
            'statut'               => $this->statut,
            'date_debut'           => $this->date_debut->format('Y-m-d'),
            'date_fin'             => $this->date_fin?->format('Y-m-d'),
            'premiere_echeance'    => $this->premiere_echeance->format('Y-m-d'),
            'montant_ht'           => $this->montant_ht,
            'tva'                  => $this->tva,
            'montant_ttc'          => $this->montant_ttc,
            'frais_syndic'         => $this->frais_syndic,
            'retenue_source'       => $this->retenue_source,
            'montant_paiement'     => $this->montant_paiement,
            'periodicite'          => $this->periodicite,
            'jour_paiement'        => $this->jour_paiement,
            'depot_garantie'       => $this->depot_garantie,
            'renouvellement_auto'  => $this->renouvellement_auto,
            'assurance'            => $this->assurance ? asset('storage/' . $this->assurance) : null,
            'assurance_nom'        => $this->assurance ? basename($this->assurance) : null,
            'fichier'              => $this->fichier,
            'notes'                => $this->notes,
            'bien'                 => new BienResource($this->whenLoaded('bien')),
            'quittances'           => QuittanceResource::collection($this->whenLoaded('quittances')),
            'created_at'           => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'           => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
