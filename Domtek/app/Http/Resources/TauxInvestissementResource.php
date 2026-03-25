<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TauxInvestissementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'taux'        => $this->taux,
            'periode'     => $this->periode,
            'description' => $this->description,
            'date_debut'  => $this->date_debut->format('Y-m-d'),
            'date_fin'    => $this->date_fin?->format('Y-m-d'),
            'created_at'  => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'  => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
