<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'civilite'          => ['nullable', 'in:M.,Mme,Mlle'],
            'nom'               => ['sometimes', 'string', 'max:100'],
            'prenom'            => ['sometimes', 'string', 'max:100'],
            'email'             => ['nullable', 'email', 'max:255'],
            'telephone'         => ['nullable', 'string', 'max:20'],
            'adresse'           => ['nullable', 'string', 'max:255'],
            'ville'             => ['nullable', 'string', 'max:100'],
            'date_naissance'    => ['nullable', 'date', 'before:today'],
            'lieu_naissance'    => ['nullable', 'string', 'max:100'],
            'type_piece'        => ['nullable', 'in:CIN,Passeport'],
            'cin'               => ['nullable', 'string', 'max:20'],
            'urgence_nom'       => ['nullable', 'string', 'max:100'],
            'urgence_telephone' => ['nullable', 'string', 'max:20'],
            'urgence_relation'  => ['nullable', 'string', 'max:50'],
            'notes'             => ['nullable', 'string'],
        ];
    }
}
