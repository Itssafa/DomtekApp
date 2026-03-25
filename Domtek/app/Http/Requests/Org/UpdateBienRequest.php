<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'immeuble_id'      => ['nullable', 'exists:immeubles,id'],
            'bloc'             => ['nullable', 'integer', 'min:1'],
            'titre'            => ['sometimes', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'type_transaction' => ['sometimes', 'in:vente,loyer'],
            'type_bien'        => ['sometimes', 'in:appartement,maison,villa,bureau,terrain,autre'],
            'prix'             => ['sometimes', 'numeric', 'min:0'],
            'superficie'       => ['nullable', 'numeric', 'min:0'],
            'adresse'          => ['nullable', 'string', 'max:255'],
            'ville'            => ['nullable', 'string', 'max:100'],
            'nb_pieces'        => ['nullable', 'integer', 'min:0'],
            'nb_chambres'      => ['nullable', 'integer', 'min:0'],
            'nb_salles_bain'   => ['nullable', 'integer', 'min:0'],
            'etage'            => ['nullable', 'integer'],
            'statut'           => ['sometimes', 'in:disponible,vendu,loue,indisponible'],
        ];
    }
}
