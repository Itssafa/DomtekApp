<?php

namespace App\Http\Requests\Concerns;

use App\Models\Bien;
use App\Models\Immeuble;
use Illuminate\Validation\Validator;

/**
 * Un bien rattaché à un immeuble ne peut pas être à un étage ou dans un bloc
 * que cet immeuble ne possède pas.
 *
 * Les formulaires construisent déjà leurs listes déroulantes à partir de
 * `nb_etages` et `nb_blocs`, ce qui rend le choix impossible à la souris. Rien
 * ne le vérifiait côté serveur : un appel direct plaçait un bien au 40ᵉ étage
 * d'un immeuble de trois.
 */
trait VerifieStructureImmeuble
{
    protected function verifierStructure(Validator $v, ?Bien $courant = null): void
    {
        $immeubleId = $this->input('immeuble_id', $courant?->immeuble_id);

        // Bien indépendant : il n'y a pas de structure à respecter.
        if (! $immeubleId) {
            return;
        }

        $immeuble = Immeuble::find($immeubleId);

        if (! $immeuble) {
            return;
        }

        if ($this->filled('etage') && $immeuble->nb_etages !== null
            && (int) $this->input('etage') > (int) $immeuble->nb_etages) {
            $v->errors()->add('etage', sprintf(
                "L'immeuble « %s » compte %d étage(s) : l'étage %d n'existe pas.",
                $immeuble->nom ?? "#{$immeuble->id}",
                $immeuble->nb_etages,
                (int) $this->input('etage'),
            ));
        }

        if (! $this->filled('bloc')) {
            return;
        }

        if (! $immeuble->a_blocs) {
            $v->errors()->add('bloc', sprintf(
                "L'immeuble « %s » n'est pas divisé en blocs.",
                $immeuble->nom ?? "#{$immeuble->id}",
            ));
            return;
        }

        if ($immeuble->nb_blocs !== null && (int) $this->input('bloc') > (int) $immeuble->nb_blocs) {
            $v->errors()->add('bloc', sprintf(
                "L'immeuble « %s » compte %d bloc(s) : le bloc %d n'existe pas.",
                $immeuble->nom ?? "#{$immeuble->id}",
                $immeuble->nb_blocs,
                (int) $this->input('bloc'),
            ));
        }
    }
}
