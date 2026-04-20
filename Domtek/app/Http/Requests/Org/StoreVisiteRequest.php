<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class StoreVisiteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'prospect_id' => ['required', 'integer', 'exists:prospects,id'],
            'bien_id'     => ['required', 'integer', 'exists:biens,id'],
            'employe_id'  => ['nullable', 'integer', 'exists:employes,id'],
            'nom_agent'   => ['nullable', 'string', 'max:255'],
            'date_visite' => ['required', 'date'],
            'notes'       => ['nullable', 'string'],
        ];
    }
}
