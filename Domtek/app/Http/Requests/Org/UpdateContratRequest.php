<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateContratRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'designation'          => ['nullable', 'string', 'max:255'],
            'utilisation'          => ['nullable', 'in:residence_primaire,residence_secondaire,professionnel,commercial,autre'],
            'type'                 => ['sometimes', 'in:bail_habitation,bail_etudiant,bail_professionnel,bail_commercial,bail_saisonnier,loyer,vente,autre'],
            'date_fin'             => ['nullable', 'date'],
            'montant_ht'           => ['sometimes', 'numeric', 'min:0'],
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
            'statut'               => ['sometimes', 'in:actif,termine,resilie'],
            'notes'                => ['nullable', 'string'],
            'forme_juridique'      => ['nullable', 'string', 'max:100'],
            'representant'         => ['nullable', 'string', 'max:150'],
            'date_contrat'         => ['nullable', 'date'],
            'ville_signature'      => ['nullable', 'string', 'max:100'],
            'cin_delivree_le'      => ['nullable', 'date', 'before_or_equal:today'],
        ];
    }

    /**
     * Cohérence des dates et des montants à la modification.
     *
     * `date_debut` n'est pas modifiable et n'apparaît donc pas dans le payload :
     * la comparaison porte sur la valeur enregistrée, là où
     * `StoreContratRequest` peut se contenter de `after:date_debut`. Sans cela,
     * un bail créé correctement pouvait être modifié pour se terminer avant
     * d'avoir commencé.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $contrat = $this->route('contrat');
            $debut   = $contrat?->date_debut?->timestamp;

            if ($debut && $this->filled('date_fin')
                && strtotime($this->input('date_fin')) <= $debut) {
                $v->errors()->add(
                    'date_fin',
                    'La date de fin doit suivre le début du contrat ('
                    . $contrat->date_debut->format('d/m/Y') . ').'
                );
            }

            if ($debut && $this->filled('premiere_echeance')
                && strtotime($this->input('premiere_echeance')) < $debut) {
                $v->errors()->add(
                    'premiere_echeance',
                    'La première échéance ne peut pas précéder le début du contrat.'
                );
            }

            // Un TTC inférieur au HT produirait une TVA négative. Les deux
            // champs sont saisis librement, rien ne les reliait.
            $ht  = $this->filled('montant_ht')  ? (float) $this->input('montant_ht')  : (float) ($contrat->montant_ht ?? 0);
            $ttc = $this->filled('montant_ttc') ? (float) $this->input('montant_ttc') : null;

            if ($ttc !== null && $ht > 0 && $ttc < $ht) {
                $v->errors()->add('montant_ttc', 'Le montant TTC ne peut pas être inférieur au montant HT.');
            }
        });
    }
}
