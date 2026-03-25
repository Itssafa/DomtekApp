<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class IndexOrganisationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'statut' => ['sometimes', 'string', 'in:en_attente,active,inactive'],
            'search' => ['sometimes', 'string', 'max:255'],
        ];
    }
}
