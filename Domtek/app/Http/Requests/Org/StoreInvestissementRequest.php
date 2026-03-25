<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvestissementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'taux'        => ['required', 'numeric', 'min:0', 'max:100'],
            'periode'     => ['required', 'in:mensuel,trimestriel,annuel'],
            'description' => ['nullable', 'string', 'max:255'],
            'date_debut'  => ['required', 'date'],
            'date_fin'    => ['nullable', 'date', 'after:date_debut'],
        ];
    }
}
