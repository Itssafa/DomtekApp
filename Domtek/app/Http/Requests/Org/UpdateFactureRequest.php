<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateFactureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'montant'       => ['sometimes', 'numeric', 'min:0'],
            'date_echeance' => ['sometimes', 'date'],
            'periode_debut' => ['nullable', 'date'],
            'periode_fin'   => ['nullable', 'date'],
            'statut'        => ['sometimes', 'in:en_attente,payee,en_retard'],
            'reference'     => ['nullable', 'string', 'max:100'],
            'notes'         => ['nullable', 'string'],
        ];
    }

    /**
     * Cohérence des dates à la modification.
     *
     * `date_emission` n'est pas modifiable et n'apparaît donc pas dans le
     * payload : la comparaison porte sur la valeur enregistrée, et non sur un
     * champ du formulaire comme le fait `StoreFactureRequest`. Sans cela, une
     * facture créée correctement pouvait être modifiée pour porter une
     * échéance antérieure à son émission.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $facture = $this->route('facture');

            if ($facture && $this->filled('date_echeance') && $facture->date_emission) {
                if (strtotime($this->input('date_echeance')) < $facture->date_emission->startOfDay()->timestamp) {
                    $v->errors()->add(
                        'date_echeance',
                        "L'échéance ne peut pas précéder la date d'émission ("
                        . $facture->date_emission->format('d/m/Y') . ').'
                    );
                }
            }

            // La période couverte peut être modifiée champ par champ : on
            // retombe sur la valeur enregistrée pour la borne non soumise.
            $debut = $this->filled('periode_debut')
                ? strtotime($this->input('periode_debut'))
                : $facture?->periode_debut?->timestamp;

            $fin = $this->filled('periode_fin')
                ? strtotime($this->input('periode_fin'))
                : $facture?->periode_fin?->timestamp;

            if ($debut && $fin && $fin < $debut) {
                $v->errors()->add('periode_fin', 'La fin de période ne peut pas précéder son début.');
            }
        });
    }
}
