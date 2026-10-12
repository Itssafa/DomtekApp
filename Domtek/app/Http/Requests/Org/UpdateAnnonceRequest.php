<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateAnnonceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre'            => ['sometimes', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'date_publication' => ['nullable', 'date'],
            'statut'           => ['sometimes', 'in:brouillon,planifiee,publiee,archivee'],
        ];
    }

    /**
     * Une date de publication ne vaut pour l'avenir que lorsqu'on la change.
     *
     * `StoreAnnonceRequest` impose `after_or_equal:today`, mais reprendre la
     * règle telle quelle ici rendrait impossible la simple correction du titre
     * d'une annonce déjà publiée : sa date est, par nature, passée. La
     * contrainte ne s'applique donc qu'à une véritable reprogrammation.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if (! $this->filled('date_publication')) {
                return;
            }

            $annonce  = $this->route('annonce');
            $soumise  = strtotime($this->input('date_publication'));
            $actuelle = $annonce?->date_publication;

            // Comparaison au jour et non à la seconde : la valeur stockée est
            // un datetime porteur de l'heure de programmation, tandis que le
            // formulaire n'envoie qu'une date, interprétée à minuit. Comparer
            // les horodatages ferait passer pour une reprogrammation le simple
            // renvoi de la date existante — et bloquerait la correction du
            // titre d'une annonce déjà publiée.
            if ($actuelle && $actuelle->format('Y-m-d') === date('Y-m-d', $soumise)) {
                return;
            }

            if ($soumise < strtotime('today')) {
                $v->errors()->add(
                    'date_publication',
                    'Une nouvelle date de publication ne peut pas être dans le passé.'
                );
            }
        });
    }
}
