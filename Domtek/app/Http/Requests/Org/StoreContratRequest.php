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

        // Cas 1 : client existant → client_ids
        // Cas 2 : prospect à convertir → prospect_id
        // Cas 3 : nouveau client inline → nouveau_client.*
        $hasClientIds    = $this->filled('client_ids');
        $hasProspectId   = $this->filled('prospect_id');
        $hasNouveauClient = $this->filled('nouveau_client');

        $clientRules = [];

        if ($hasClientIds || (!$hasProspectId && !$hasNouveauClient)) {
            $clientRules['client_ids']   = ['required', 'array', 'min:1'];
            $clientRules['client_ids.*'] = ['integer', 'exists:clients,id'];
        }

        if ($hasProspectId) {
            $clientRules['prospect_id'] = ['required', 'integer', 'exists:prospects,id'];
        }

        if ($hasNouveauClient) {
            $clientRules['nouveau_client.nom']    = ['required', 'string', 'max:100'];
            $clientRules['nouveau_client.prenom'] = ['required', 'string', 'max:100'];
            $clientRules['nouveau_client.civilite'] = ['nullable', 'in:M.,Mme,Mlle'];
            $clientRules['nouveau_client.email']    = ['nullable', 'email', 'max:255'];
            $clientRules['nouveau_client.telephone'] = ['nullable', 'string', 'max:20'];
            $clientRules['nouveau_client.adresse']   = ['nullable', 'string', 'max:255'];
            $clientRules['nouveau_client.ville']     = ['nullable', 'string', 'max:100'];
            $clientRules['nouveau_client.cin']       = ['nullable', 'string', 'max:20'];
            $clientRules['nouveau_client.date_naissance'] = ['nullable', 'date'];
        }

        return array_merge($clientRules, [
            'bien_id'              => ['required', 'exists:biens,id'],
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
        ]);
    }
}
