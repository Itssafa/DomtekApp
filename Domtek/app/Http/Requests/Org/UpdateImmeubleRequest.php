<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UpdateImmeubleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nom'                  => ['sometimes', 'string', 'max:150'],
            'type_usage'           => ['sometimes', 'in:residentiel,professionnel,mixte'],
            'type_propriete'       => ['sometimes', 'in:auto_propriete,co_propriete'],
            'a_blocs'              => ['sometimes', 'boolean'],
            'nb_blocs'             => ['nullable', 'integer', 'min:1'],
            'nb_etages'            => ['sometimes', 'integer', 'min:0'],
            'adresse'              => ['nullable', 'string', 'max:255'],
            'ville'                => ['nullable', 'string', 'max:100'],
            'pays'                 => ['nullable', 'string', 'max:100'],
            'sous_sol'             => ['sometimes', 'boolean'],
            'cameras_surveillance' => ['sometimes', 'boolean'],
        ];
    }
}
