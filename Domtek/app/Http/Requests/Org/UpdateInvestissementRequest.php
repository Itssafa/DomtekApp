<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvestissementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'taux'        => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'periode'     => ['sometimes', 'in:mensuel,trimestriel,annuel'],
            'description' => ['nullable', 'string', 'max:255'],
            'date_debut'  => ['sometimes', 'date'],
            'date_fin'    => ['nullable', 'date', 'after:date_debut'],
        ];
    }
}
