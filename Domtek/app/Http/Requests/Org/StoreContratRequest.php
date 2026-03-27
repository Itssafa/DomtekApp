<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class StoreContratRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bien_id'          => ['required', 'exists:biens,id'],
            'client_ids'       => ['required', 'array', 'min:1'],
            'client_ids.*'     => ['integer', 'exists:clients,id'],
            'type'             => ['required', 'in:vente,loyer'],
            'date_debut'       => ['required', 'date'],
            'date_fin'         => [
                $this->input('type') === 'loyer' ? 'required' : 'nullable',
                'date',
                'after:date_debut',
            ],
            'montant'          => ['required', 'numeric', 'min:0'],
            'notes'            => ['nullable', 'string'],
            'forme_juridique'  => ['nullable', 'string', 'max:100'],
            'representant'     => ['nullable', 'string', 'max:150'],
            'date_contrat'     => ['nullable', 'date'],
            'ville_signature'  => ['nullable', 'string', 'max:100'],
            'cin_delivree_le'  => ['nullable', 'date'],
        ];
    }
}
