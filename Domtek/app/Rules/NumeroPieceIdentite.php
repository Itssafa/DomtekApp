<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Numéro de pièce d'identité, dont le format dépend du type de pièce saisi.
 *
 * - CIN tunisienne : exactement 8 chiffres.
 * - Passeport : chiffres uniquement, longueur libre (les formats varient
 *   selon le pays émetteur).
 *
 * Le type est lu dans la requête via `type_piece`. Les entités qui n'offrent
 * pas ce choix — les employés, par exemple — n'acceptent qu'une CIN : en
 * l'absence du champ, la règle applique donc les 8 chiffres.
 *
 * Reproduit côté serveur ce que le filtre de saisie `setDigitsOnly` fait
 * déjà dans les formulaires, afin qu'un appel direct à l'API n'y échappe pas.
 */
class NumeroPieceIdentite implements DataAwareRule, ValidationRule
{
    /** @var array<string, mixed> */
    private array $data = [];

    public function setData(array $data): static
    {
        $this->data = $data;
        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_scalar($value)) {
            $fail('Le champ :attribute doit être un numéro de pièce d\'identité.');
            return;
        }

        $numero = trim((string) $value);

        if (! preg_match('/^\d+$/', $numero)) {
            $fail('Le champ :attribute ne doit contenir que des chiffres.');
            return;
        }

        // Le passeport est le seul cas où la longueur n'est pas imposée.
        if (($this->data['type_piece'] ?? 'CIN') === 'Passeport') {
            return;
        }

        if (strlen($numero) !== 8) {
            $fail('La CIN doit contenir exactement 8 chiffres.');
        }
    }
}
