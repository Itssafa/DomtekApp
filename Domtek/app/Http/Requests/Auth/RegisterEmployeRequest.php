<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterEmployeRequest extends FormRequest
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
            'email'           => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'        => ['required', 'string', 'min:8', 'confirmed'],
            'organisation_id' => ['required', 'integer', 'exists:organisations,id'],
            'date_naissance'  => ['nullable', 'date', 'before:today'],
            'cin'             => ['nullable', 'string', 'max:20'],
            'cin_delivree_le' => ['nullable', 'date'],
            'cin_delivree_a'  => ['nullable', 'string', 'max:100'],
        ];
    }
}
