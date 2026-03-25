<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class StoreFactureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id'     => ['required', 'exists:clients,id'],
            'contrat_id'    => ['nullable', 'exists:contrats,id'],
            'type'          => ['required', 'in:eau,electricite,gaz,electricite_gaz,loyer'],
            'montant'       => ['required', 'numeric', 'min:0'],
            'date_emission' => ['required', 'date'],
            'date_echeance' => ['required', 'date', 'after_or_equal:date_emission'],
            'reference'     => ['nullable', 'string', 'max:100'],
            'notes'         => ['nullable', 'string'],
        ];
    }
}
