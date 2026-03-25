<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFactureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'montant'       => ['sometimes', 'numeric', 'min:0'],
            'date_echeance' => ['sometimes', 'date'],
            'statut'        => ['sometimes', 'in:en_attente,payee,en_retard'],
            'reference'     => ['nullable', 'string', 'max:100'],
            'notes'         => ['nullable', 'string'],
        ];
    }
}
