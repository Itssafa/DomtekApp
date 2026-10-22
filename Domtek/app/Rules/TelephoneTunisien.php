<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Numéro de téléphone tunisien : exactement 8 chiffres, sans indicatif.
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

        if (! preg_match('/^\d{8}$/', $normalise)) {
            $fail('Le champ :attribute doit contenir exactement 8 chiffres.');
        }
    }
}
