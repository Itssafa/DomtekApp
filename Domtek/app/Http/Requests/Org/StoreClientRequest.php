<?php

namespace App\Http\Requests\Org;

use App\Rules\NumeroPieceIdentite;
use App\Rules\TelephoneTunisien;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'civilite'          => ['nullable', 'in:M.,Mme,Mlle'],
            'nom'               => ['required', 'string', 'max:100'],
            'prenom'            => ['required', 'string', 'max:100'],
            // Obligatoire : c'est l'identifiant de connexion du client et le
            // canal d'envoi de son lien d'activation.
            // Unicité par agence, pas globale : une même personne peut être
            // cliente de plusieurs organisations.
            'email'             => [
                'required',
                'email',
                'max:255',
                Rule::unique('clients', 'email')
                    ->where('organisation_id', $this->user()->resolveOrgId()),
            ],
            'telephone'         => ['required', 'string', 'max:20', new TelephoneTunisien],
            'adresse'           => ['nullable', 'string', 'max:255'],
            'ville'             => ['nullable', 'string', 'max:100'],
            'date_naissance'    => ['nullable', 'date', 'before:today'],
            'lieu_naissance'    => ['nullable', 'string', 'max:100'],
            'type_piece'        => ['nullable', 'in:CIN,Passeport'],
            'cin'               => ['required', 'string', 'max:20', new NumeroPieceIdentite],
            'cin_delivree_le'   => ['required', 'date'],
            'cin_delivree_a'    => ['required', 'string', 'max:100'],
            'document_identite' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'urgence_nom'       => ['nullable', 'string', 'max:100'],
            'urgence_telephone' => ['nullable', 'string', 'max:20', new TelephoneTunisien],
            'urgence_relation'  => ['nullable', 'string', 'max:50'],
            'notes'             => ['nullable', 'string'],
        ];
    }
}
