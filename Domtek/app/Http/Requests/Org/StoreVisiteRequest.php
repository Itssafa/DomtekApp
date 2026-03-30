<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class StoreVisiteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'client_id'   => ['required', 'integer', 'exists:clients,id'],
            'bien_id'     => ['required', 'integer', 'exists:biens,id'],
            'nom_agent'   => ['required', 'string', 'max:255'],
            'date_visite' => ['required', 'date'],
            'notes'       => ['nullable', 'string'],
        ];
    }
}
