<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAnnonceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre'            => ['sometimes', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'date_publication' => ['nullable', 'date'],
            'statut'           => ['sometimes', 'in:brouillon,planifiee,publiee,archivee'],
        ];
    }
}
