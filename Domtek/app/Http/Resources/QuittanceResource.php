<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuittanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'location_id'    => $this->location_id,
            'periode'        => $this->periode,
            'date_echeance'  => $this->date_echeance->format('Y-m-d'),
            'montant'        => $this->montant,
            'montant_paye'   => $this->montant_paye,
            'date_paiement'  => $this->date_paiement?->format('Y-m-d'),
            'statut'         => $this->statut,
            'notes'          => $this->notes,
            'created_at'     => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
