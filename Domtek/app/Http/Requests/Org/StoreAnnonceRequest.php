<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnnonceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bien_id'          => ['required', 'exists:biens,id'],
            'titre'            => ['required', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'date_publication' => ['nullable', 'date', 'after_or_equal:today'],
            'statut'           => ['sometimes', 'in:brouillon,planifiee,publiee'],
            'photos'           => ['sometimes', 'array'],
            'photos.*'         => ['image', 'max:5120'],
        ];
    }
}
