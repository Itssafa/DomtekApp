<?php

namespace App\Http\Requests\Client;

use App\Rules\TelephoneTunisien;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Coordonnées que le client peut modifier lui-même depuis son espace.
 *
 * L'identité (nom, prénom, CIN) et l'e-mail de connexion restent gérés par
 * l'agence : ils figurent sur les contrats et servent d'identifiant.
 */
class UpdateCompteClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $lettres = 'regex:/^[\pL\s\'\-]+$/u';

        return [
            'telephone'         => ['required', 'string', 'max:20', new TelephoneTunisien],
            'adresse'           => ['nullable', 'string', 'max:255'],
            'ville'             => ['nullable', 'string', 'max:100', $lettres],
            'urgence_nom'       => ['nullable', 'string', 'max:100'],
            'urgence_telephone' => ['nullable', 'string', 'max:20', new TelephoneTunisien],
            'urgence_relation'  => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'ville.regex' => 'La ville ne doit contenir que des lettres, des espaces, des apostrophes ou des tirets.',
        ];
    }
}
