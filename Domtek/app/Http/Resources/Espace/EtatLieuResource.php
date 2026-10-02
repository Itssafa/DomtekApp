<?php

namespace App\Http\Resources\Espace;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * État des lieux vu par le client : les relevés qui l'engagent à l'entrée
 * comme à la sortie, et le commentaire consigné par l'agence.
 */
class EtatLieuResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'designation'        => $this->designation,
            'type'               => $this->type,   // entree | sortie
            'date'               => $this->date?->format('Y-m-d'),
            'releve_eau'         => $this->releve_eau !== null ? (float) $this->releve_eau : null,
            'releve_electricite' => $this->releve_electricite !== null ? (float) $this->releve_electricite : null,
            'releve_gaz'         => $this->releve_gaz !== null ? (float) $this->releve_gaz : null,
            'remise_cles'        => (bool) $this->remise_cles,
            'commentaire'        => $this->commentaire,
        ];
    }
}
