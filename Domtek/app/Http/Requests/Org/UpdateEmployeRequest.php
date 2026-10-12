<?php

namespace App\Http\Requests\Org;

use App\Rules\NumeroPieceIdentite;
use App\Rules\TelephoneTunisien;
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
            'telephone'       => ['sometimes', 'required', 'string', 'max:20', new TelephoneTunisien],
            'cin'             => ['sometimes', 'required', 'string', 'max:20', new NumeroPieceIdentite('CIN')],
            'cin_delivree_le' => ['sometimes', 'required', 'date', 'before_or_equal:today'],
            'cin_delivree_a'  => ['sometimes', 'required', 'string', 'max:100'],
            'poste'           => ['nullable', 'string', 'max:100'],
            'date_embauche'   => ['nullable', 'date', 'before_or_equal:today'],
            'statut'          => ['sometimes', 'in:actif,inactif'],
        ];
    }
}
