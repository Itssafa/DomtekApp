<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Numéro de téléphone tunisien : 8 chiffres commençant par 2 à 9,
 * éventuellement précédé de l'indicatif +216 ou 00216.
 *
 * Les séparateurs de lisibilité sont tolérés à la saisie — « 53 542 151 »
 * et « 53-542-151 » désignent le même numéro — et retirés avant contrôle.
 * Le stockage, lui, reste tel que saisi : cette règle valide, elle ne
 * normalise pas.
 */
class TelephoneTunisien implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_scalar($value)) {
            $fail('Le champ :attribute doit être un numéro de téléphone.');
            return;
        }

        $normalise = preg_replace('/[\s.\-()]/', '', (string) $value);

        if (! preg_match('/^(?:\+216|00216)?[2-9]\d{7}$/', $normalise)) {
            $fail('Le champ :attribute doit être un numéro tunisien valide : 8 chiffres commençant par 2 à 9, indicatif +216 facultatif.');
        }
    }
}
