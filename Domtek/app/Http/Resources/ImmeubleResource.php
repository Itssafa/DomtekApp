<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImmeubleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'nom'                  => $this->nom,
            'type_usage'           => $this->type_usage,
            'type_propriete'       => $this->type_propriete,
            'a_blocs'              => $this->a_blocs,
            'nb_blocs'             => $this->nb_blocs,
            'nb_etages'            => $this->nb_etages,
            'adresse'              => $this->adresse,
            'ville'                => $this->ville,
            'pays'                 => $this->pays,
            'sous_sol'             => $this->sous_sol,
            'cameras_surveillance' => $this->cameras_surveillance,
            'photos'               => $this->whenLoaded('photos', fn() =>
                $this->photos->map(fn($p) => [
                    'id'    => $p->id,
                    'url'   => asset('storage/' . $p->chemin),
                    'ordre' => $p->ordre,
                ])
            ),
            'photos_count'         => $this->whenCounted('photos'),
            'created_at'           => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at'           => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
