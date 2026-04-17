<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom'             => ['sometimes', 'required', 'string', 'max:100'],
            'prenom'          => ['sometimes', 'required', 'string', 'max:100'],
            'email'           => ['nullable', 'email', 'max:255'],
            'telephone'       => ['sometimes', 'required', 'string', 'max:20'],
            'cin'             => ['sometimes', 'required', 'string', 'max:20'],
            'cin_delivree_le' => ['sometimes', 'required', 'date'],
            'cin_delivree_a'  => ['sometimes', 'required', 'string', 'max:100'],
            'poste'           => ['nullable', 'string', 'max:100'],
            'date_embauche'   => ['nullable', 'date'],
            'statut'          => ['sometimes', 'in:actif,inactif'],
        ];
    }
}
