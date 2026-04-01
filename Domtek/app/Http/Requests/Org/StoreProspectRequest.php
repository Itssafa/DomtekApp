<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class StoreProspectRequest extends FormRequest
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
            'email'             => ['nullable', 'email', 'max:255'],
            'telephone'         => ['nullable', 'string', 'max:20'],
            'adresse'           => ['nullable', 'string', 'max:255'],
            'ville'             => ['nullable', 'string', 'max:100'],
            'date_naissance'    => ['nullable', 'date', 'before:today'],
            'lieu_naissance'    => ['nullable', 'string', 'max:100'],
            'type_piece'        => ['nullable', 'in:CIN,Passeport'],
            'cin'               => ['nullable', 'string', 'max:20'],
            'document_identite' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'notes'              => ['nullable', 'string'],
            // Profil prospect
            'profession'         => ['nullable', 'string', 'max:150'],
            'revenus_mensuels'   => ['nullable', 'in:moins_1000,1000_2000,3000_6000,7000_10000,plus_10000'],
            'composition_foyer'  => ['nullable', 'array'],
            'composition_foyer.*'=> ['in:enfants,animaux'],
            'biens_interet'      => ['nullable', 'array'],
            'biens_interet.*'    => ['integer', 'exists:biens,id'],
            'score_solvabilite'          => ['nullable', 'in:verifie,plutot_verifie,plutot_non_verifie,non_verifie'],
            'impression_premiere_visite' => ['nullable', 'in:satisfait,neutre,non_satisfait'],
            'hierarchie_besoins' => ['nullable', 'array'],
            'hierarchie_besoins.*' => ['in:prix,emplacement,superficie,transport,commodites'],
        ];
    }
}
