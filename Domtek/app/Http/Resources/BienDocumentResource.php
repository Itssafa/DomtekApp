<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BienDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'nom'           => $this->nom,
            'url'           => $this->url,
            'type_document' => $this->type_document,
            'created_at'    => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
