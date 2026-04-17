<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom'             => ['required', 'string', 'max:100'],
            'prenom'          => ['required', 'string', 'max:100'],
            'email'           => ['nullable', 'email', 'max:255'],
            'telephone'       => ['required', 'string', 'max:20'],
            'cin'             => ['required', 'string', 'max:20'],
            'cin_delivree_le' => ['required', 'date'],
            'cin_delivree_a'  => ['required', 'string', 'max:100'],
            'poste'           => ['nullable', 'string', 'max:100'],
            'date_embauche'   => ['nullable', 'date'],
            'statut'          => ['sometimes', 'in:actif,inactif'],
        ];
    }
}
