<?php

namespace App\Services;

use Twilio\Rest\Client;
use Throwable;

class SmsService
{
    private Client $twilio;
    private string $from;

    public function __construct()
    {
        $this->twilio = new Client(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );
        $this->from = config('services.twilio.from');
    }

    /**
     * Envoie un SMS. Retourne true si envoyé, false en cas d'échec.
     * Le numéro doit être au format international (ex : +21612345678).
     */
    public function send(string $to, string $message): bool
    {
        if (empty($to)) {
            return false;
        }

        // Normaliser le numéro tunisien : 8 chiffres → +216XXXXXXXX
        $to = $this->normaliserNumero($to);

        try {
            $this->twilio->messages->create($to, [
                'from' => $this->from,
                'body' => $message,
            ]);
            return true;
        } catch (Throwable) {
            return false;
        }
    }

    private function normaliserNumero(string $numero): string
    {
        // Supprimer tout sauf les chiffres et le +
        $numero = preg_replace('/[^\d+]/', '', $numero);

        // Déjà au format international
        if (str_starts_with($numero, '+')) {
            return $numero;
        }

        // Numéro tunisien local (8 chiffres)
        if (strlen($numero) === 8) {
            return '+216' . $numero;
        }

        // Avec préfixe 00216
        if (str_starts_with($numero, '00216')) {
            return '+' . substr($numero, 2);
        }

        return '+' . $numero;
    }
}
