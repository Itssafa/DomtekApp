<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEtatLieuRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'contrat_id'          => ['sometimes', 'integer', 'exists:contrats,id'],
            'designation'         => ['nullable', 'string', 'max:255'],
            'type'                => ['sometimes', 'in:entree,sortie'],
            'date'                => ['sometimes', 'date'],
            'releve_eau'          => ['nullable', 'numeric', 'min:0'],
            'releve_electricite'  => ['nullable', 'numeric', 'min:0'],
            'releve_gaz'          => ['nullable', 'numeric', 'min:0'],
            'remise_cles'         => ['boolean'],
            'commentaire'         => ['nullable', 'string'],
        ];
    }
}
