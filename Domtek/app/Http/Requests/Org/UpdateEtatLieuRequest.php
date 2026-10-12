<?php

namespace App\Http\Requests\Org;

use App\Http\Requests\Concerns\VerifieRelevesCompteurs;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateEtatLieuRequest extends FormRequest
{
    use VerifieRelevesCompteurs;

    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'location_id'         => ['sometimes', 'integer', 'exists:locations,id'],
            'designation'         => ['nullable', 'string', 'max:255'],
            'type'                => ['sometimes', 'in:entree,sortie'],
            'date'                => ['sometimes', 'date'],
            'releve_eau'          => ['nullable', 'numeric', 'min:0'],
            'releve_electricite'  => ['nullable', 'numeric', 'min:0'],
            'releve_gaz'          => ['nullable', 'numeric', 'min:0'],
            'remise_cles'         => ['boolean'],
            'commentaire'         => ['nullable', 'string'],
            'inventaires'                      => ['nullable', 'array'],
            'inventaires.*.piece'              => ['required', 'string', 'max:100'],
            'inventaires.*.categorie'          => ['required', 'in:meuble,electromenager,equipement,textile'],
            'inventaires.*.designation'        => ['required', 'string', 'max:255'],
            'inventaires.*.description'        => ['nullable', 'string'],
            'inventaires.*.date'               => ['nullable', 'date'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        // L'enregistrement courant fournit le type et le rattachement, qui ne
        // sont pas forcément soumis lors d'une modification partielle.
        $validator->after(
            fn (Validator $v) => $this->verifierReleves($v, $this->route('etat_lieu'))
        );
    }
}
