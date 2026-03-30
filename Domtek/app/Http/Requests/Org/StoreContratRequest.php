<?php

namespace App\Http\Requests\Org;

use App\Models\Contrat;
use Illuminate\Foundation\Http\FormRequest;

class StoreContratRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isLocation = in_array($this->input('type'), Contrat::TYPES_LOCATION);

        return [
            'bien_id'              => ['required', 'exists:biens,id'],
            'client_ids'           => ['required', 'array', 'min:1'],
            'client_ids.*'         => ['integer', 'exists:clients,id'],
            'designation'          => ['nullable', 'string', 'max:255'],
            'utilisation'          => ['nullable', 'in:residence_primaire,residence_secondaire,professionnel,commercial,autre'],
            'type'                 => ['required', 'in:bail_habitation,bail_etudiant,bail_professionnel,bail_commercial,bail_saisonnier,loyer,vente,autre'],
            'date_debut'           => ['required', 'date'],
            'date_fin'             => [
                $isLocation ? 'required' : 'nullable',
                'date',
                'after:date_debut',
            ],
            'montant_ht'           => ['required', 'numeric', 'min:0'],
            'tva'                  => ['nullable', 'numeric', 'min:0', 'max:100'],
            'montant_ttc'          => ['nullable', 'numeric', 'min:0'],
            'frais_syndic'         => ['nullable', 'numeric', 'min:0'],
            'retenue_source'       => ['nullable', 'numeric', 'min:0', 'max:100'],
            'montant_paiement'     => ['nullable', 'numeric', 'min:0'],
            'periodicite_paiement' => ['nullable', 'in:mensuel,bimestriel,trimestriel,quadrimestriel,semestriel,annuel'],
            'jour_paiement'        => ['nullable', 'integer', 'min:1', 'max:28'],
            'depot_garantie'       => ['nullable', 'numeric', 'min:0'],
            'premiere_echeance'    => ['nullable', 'date'],
            'assurance'            => ['nullable', 'string'],
            'notes'                => ['nullable', 'string'],
            'forme_juridique'      => ['nullable', 'string', 'max:100'],
            'representant'         => ['nullable', 'string', 'max:150'],
            'date_contrat'         => ['nullable', 'date'],
            'ville_signature'      => ['nullable', 'string', 'max:100'],
            'cin_delivree_le'      => ['nullable', 'date'],
        ];
    }
}
