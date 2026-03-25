<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnnonceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'titre'            => $this->titre,
            'description'      => $this->description,
            'statut'           => $this->statut,
            'date_publication' => $this->date_publication?->format('Y-m-d H:i:s'),
            'bien'             => new BienResource($this->whenLoaded('bien')),
            'organisation'     => new OrganisationResource($this->whenLoaded('organisation')),
            'photos'           => AnnoncePhotoResource::collection($this->whenLoaded('photos')),
            'created_at'       => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'       => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
