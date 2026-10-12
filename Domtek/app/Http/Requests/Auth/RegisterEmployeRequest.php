<?php

namespace App\Http\Requests\Auth;

use App\Rules\NumeroPieceIdentite;
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
            'date_naissance'  => ['nullable', 'date', 'before:today', 'after:1900-01-01'],
            'cin'             => ['nullable', 'string', 'max:20', new NumeroPieceIdentite],
            'cin_delivree_le' => ['nullable', 'date', 'before_or_equal:today'],
            'cin_delivree_a'  => ['nullable', 'string', 'max:100'],
        ];
    }
}
