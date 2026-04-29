<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEtatLieuRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'location_id'         => ['sometimes', 'integer', 'exists:locations,id'],
            'designation'         => ['nullable', 'string', 'max:255'],
            'type'                => ['sometimes', 'in:entree,sortie'],
            'date'                => ['sometimes', 'date'],
            'releve_eau'          => ['nullable', 'numeric', 'min:0'],
            'releve_electricite'  => ['nullable', 'numeric', 'min:0'],
            'releve_gaz'          => ['nullable', 'numeric', 'min:0'],
            'remise_cles'         => ['boolean'],
            'commentaire'         => ['nullable', 'string'],
            'inventaires'                      => ['nullable', 'array'],
            'inventaires.*.piece'              => ['required', 'string', 'max:100'],
            'inventaires.*.categorie'          => ['required', 'in:meuble,electromenager,equipement,textile'],
            'inventaires.*.designation'        => ['required', 'string', 'max:255'],
            'inventaires.*.description'        => ['nullable', 'string'],
            'inventaires.*.date'               => ['nullable', 'date'],
        ];
    }
}
