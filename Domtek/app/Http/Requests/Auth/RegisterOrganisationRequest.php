<?php

namespace App\Http\Requests\Auth;

use App\Rules\TelephoneTunisien;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterOrganisationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'               => ['required', 'string', 'max:255'],
            'email'              => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'           => ['required', 'confirmed', Password::min(8)],
            'nom_organisation'   => ['required', 'string', 'max:255'],
            'adresse'            => ['nullable', 'string', 'max:255'],
            'ville'              => ['nullable', 'string', 'max:100'],
            'telephone'          => ['nullable', 'string', 'max:20', new TelephoneTunisien],
            'email_organisation' => ['nullable', 'email', 'max:255'],
            'description'        => ['nullable', 'string'],
        ];
    }
}
