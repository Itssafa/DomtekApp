<?php

namespace App\Http\Requests\Org;

use App\Models\Contrat;
use App\Models\Prospect;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            // Obligatoire : identifiant de connexion du futur espace client,
            // et canal d'envoi du lien d'activation. Unique par agence.
            $clientRules['nouveau_client.email']    = [
                'required',
                'email',
                'max:255',
                Rule::unique('clients', 'email')
                    ->where('organisation_id', $this->user()->resolveOrgId()),
            ];
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

    /**
     * Cas 2 — conversion d'un prospect : la fiche client héritera de l'e-mail
     * du prospect, lequel reste facultatif côté prospect. Sans e-mail, le
     * client n'aurait aucun accès à son espace, sans que rien ne le signale.
     * On l'exige donc au moment de la signature, où il devient nécessaire.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if (! $this->filled('prospect_id')) {
                return;
            }

            $prospect = Prospect::find($this->input('prospect_id'));

            if ($prospect && blank($prospect->email)) {
                $v->errors()->add(
                    'prospect_id',
                    "Ce prospect n'a pas d'adresse e-mail. Renseignez-la sur sa fiche "
                    . "avant de le convertir : elle servira d'identifiant à son espace client."
                );
            }
        });
    }
}
