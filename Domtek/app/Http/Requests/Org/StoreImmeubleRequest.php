<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class StoreImmeubleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nom'                  => ['required', 'string', 'max:150'],
            'type_usage'           => ['required', 'in:residentiel,professionnel,mixte'],
            'type_propriete'       => ['required', 'in:auto_propriete,co_propriete'],
            'a_blocs'              => ['required', 'boolean'],
            'nb_blocs'             => ['nullable', 'integer', 'min:1', 'required_if:a_blocs,true'],
            'nb_etages'            => ['required', 'integer', 'min:0'],
            'adresse'              => ['nullable', 'string', 'max:255'],
            'ville'                => ['nullable', 'string', 'max:100'],
            'pays'                 => ['nullable', 'string', 'max:100'],
            'sous_sol'             => ['required', 'boolean'],
            'cameras_surveillance' => ['required', 'boolean'],
            'photos'               => ['nullable', 'array'],
            'photos.*'             => ['file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
