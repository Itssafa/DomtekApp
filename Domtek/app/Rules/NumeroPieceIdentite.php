<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Numéro de pièce d'identité, dont le format dépend du type de pièce.
 *
 * - CIN tunisienne : exactement 8 chiffres.
 * - Passeport : chiffres uniquement, longueur libre (les formats varient
 *   selon le pays émetteur).
 * - Type inconnu : chiffres uniquement, longueur libre.
 *
 * Le type est lu dans la requête via `type_piece`, ou impose par le
 * constructeur quand le formulaire n'offre pas ce choix — c'est le cas des
 * employés, qui ne peuvent produire qu'une CIN : `new NumeroPieceIdentite('CIN')`.
 *
 * Le dernier cas mérite d'être explicite. Sur les fiches clients et prospects,
 * `type_piece` est facultatif : imposer les 8 chiffres faute de réponse
 * rejetait un numéro de passeport parfaitement valide, alors que le filtre de
 * saisie, lui, l'acceptait. Sans information, la règle se borne donc à exiger
 * des chiffres ; la longueur n'est contrôlée que lorsque le type est connu.
 *
 * Reproduit côté serveur ce que le filtre de saisie `setDigitsOnly` fait déjà
 * dans les formulaires, afin qu'un appel direct à l'API n'y échappe pas.
 */
class NumeroPieceIdentite implements DataAwareRule, ValidationRule
{
    /** @var array<string, mixed> */
    private array $data = [];

    /**
     * @param string|null $typeImpose Type de pièce imposé par le formulaire,
     *                                quand celui-ci n'en propose pas le choix.
     */
    public function __construct(private ?string $typeImpose = null) {}

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

        $type = $this->typeImpose ?? ($this->data['type_piece'] ?? null);

        // La longueur n'est contrôlée que si l'on sait avoir affaire à une CIN.
        if ($type === 'CIN' && strlen($numero) !== 8) {
            $fail('La CIN doit contenir exactement 8 chiffres.');
        }
    }
}
