<?php

namespace App\Http\Requests\Org;

use App\Rules\NumeroPieceIdentite;
use App\Rules\TelephoneTunisien;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'civilite'          => ['nullable', 'in:M.,Mme,Mlle'],
            'nom'               => ['sometimes', 'string', 'max:100'],
            'prenom'            => ['sometimes', 'string', 'max:100'],
            // cf. StoreClientRequest : identifiant de connexion, unique par agence.
            // On ignore la fiche courante pour permettre un enregistrement sans
            // modification de l'e-mail.
            'email'             => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('clients', 'email')
                    ->where('organisation_id', $this->user()->resolveOrgId())
                    ->ignore($this->route('client')),
            ],
            'telephone'         => ['sometimes', 'required', 'string', 'max:20', new TelephoneTunisien],
            'adresse'           => ['nullable', 'string', 'max:255'],
            'ville'             => ['nullable', 'string', 'max:100'],
            'date_naissance'    => ['nullable', 'date', 'before:today'],
            'lieu_naissance'    => ['nullable', 'string', 'max:100'],
            'type_piece'        => ['nullable', 'in:CIN,Passeport'],
            'cin'               => ['sometimes', 'required', 'string', 'max:20', new NumeroPieceIdentite],
            'cin_delivree_le'   => ['sometimes', 'required', 'date'],
            'cin_delivree_a'    => ['sometimes', 'required', 'string', 'max:100'],
            'urgence_nom'       => ['nullable', 'string', 'max:100'],
            'urgence_telephone' => ['nullable', 'string', 'max:20', new TelephoneTunisien],
            'urgence_relation'  => ['nullable', 'string', 'max:50'],
            'notes'             => ['nullable', 'string'],
        ];
    }
}
