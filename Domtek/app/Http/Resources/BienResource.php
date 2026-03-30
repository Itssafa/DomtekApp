<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BienResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'immeuble_id'        => $this->immeuble_id,
            'bloc'               => $this->bloc,
            'num'                => $this->num,
            'immeuble'           => new ImmeubleResource($this->whenLoaded('immeuble')),
            'designation'        => $this->designation,
            'description'        => $this->description,
            'notes'              => $this->notes,
            'type_transaction'   => $this->type_transaction,
            'type_location'      => $this->type_location,
            'type_bien'          => $this->type_bien,
            'prix'               => $this->prix,
            'taxe_fonciere'      => $this->taxe_fonciere,
            'regime_juridique'   => $this->regime_juridique,
            'superficie'         => $this->superficie,
            'superficie_commune' => $this->superficie_commune,
            'adresse'            => $this->adresse,
            'ville'              => $this->ville,
            'pays'               => $this->pays,
            'code_postal'        => $this->code_postal,
            'nb_pieces'          => $this->nb_pieces,
            'nb_chambres'        => $this->nb_chambres,
            'nb_salles_bain'     => $this->nb_salles_bain,
            'nb_cuisine'         => $this->nb_cuisine,
            'etage'              => $this->etage,
            'date_construction'  => $this->date_construction?->format('Y-m-d'),
            'accepte_animaux'    => $this->accepte_animaux,
            'accepte_fumeurs'    => $this->accepte_fumeurs,
            'options'            => $this->options ?? [],
            'statut'             => $this->statut,
            'image_principale'   => new BienImageResource(
                $this->whenLoaded('imagePrincipale') ?? $this->images?->first()
            ),
            'images'             => BienImageResource::collection($this->whenLoaded('images')),
            'documents'          => BienDocumentResource::collection($this->whenLoaded('documents')),
            'organisation'       => new OrganisationResource($this->whenLoaded('organisation')),
            'created_at'         => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'         => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
