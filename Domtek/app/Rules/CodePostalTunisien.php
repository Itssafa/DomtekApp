<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Code postal tunisien : exactement 4 chiffres (1000 Tunis, 4000 Sousse…).
 */
class CodePostalTunisien implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_scalar($value) || ! preg_match('/^\d{4}$/', trim((string) $value))) {
            $fail('Le champ :attribute doit être un code postal tunisien : 4 chiffres.');
        }
    }
}
