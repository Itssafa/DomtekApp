<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContratRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_fin' => ['nullable', 'date'],
            'montant'  => ['sometimes', 'numeric', 'min:0'],
            'statut'   => ['sometimes', 'in:actif,termine,resilie'],
            'notes'    => ['nullable', 'string'],
        ];
    }
}
