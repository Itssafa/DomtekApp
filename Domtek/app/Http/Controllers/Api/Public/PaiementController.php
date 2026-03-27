<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Stripe;
use Stripe\Webhook;

class PaiementController extends Controller
{
    private static array $typeLabels = [
        'eau'             => 'Eau',
        'electricite'     => 'Électricité',
        'gaz'             => 'Gaz',
        'electricite_gaz' => 'Électricité & Gaz',
        'loyer'           => 'Loyer',
    ];

    /**
     * Redirige le client vers la page de paiement Stripe pour une facture donnée.
     * URL publique, accessible depuis le lien dans l'e-mail.
     */
    public function payer(string $token): RedirectResponse
    {
        $facture = Facture::where('payment_token', $token)
            ->with('organisation')
            ->firstOrFail();

        $frontendUrl = config('services.frontend.url');

        if ($facture->statut === Facture::STATUT_PAYEE) {
            return redirect($frontendUrl . '/paiement/deja-paye');
        }

        Stripe::setApiKey(config('services.stripe.secret'));

        $typeLabel = self::$typeLabels[$facture->type] ?? ucfirst($facture->type);
        $ref       = $facture->reference ?? 'N°' . $facture->id;
        $currency  = config('services.stripe.currency', 'eur');

        // Stripe utilise les centimes : 1 EUR = 100 unités
        $unitAmount = (int) round($facture->montant * 100);

        $session = StripeSession::create([
            'payment_method_types' => ['card'],
            'line_items'           => [[
                'price_data' => [
                    'currency'     => $currency,
                    'product_data' => [
                        'name'        => "Facture {$typeLabel} — {$ref}",
                        'description' => $facture->organisation->nom,
                    ],
                    'unit_amount' => $unitAmount,
                ],
                'quantity' => 1,
            ]],
            'mode'        => 'payment',
            'success_url' => $frontendUrl . '/paiement/succes?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'  => $frontendUrl . '/paiement/annule',
            'metadata'    => [
                'payment_token' => $token,
                'facture_id'    => $facture->id,
            ],
        ]);

        $facture->update(['stripe_session_id' => $session->id]);

        return redirect($session->url);
    }

    /**
     * Webhook Stripe : marque la facture comme payée après confirmation du paiement.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload   = $request->getContent();
        $signature = $request->header('Stripe-Signature');
        $secret    = config('services.stripe.webhook_secret');

        try {
            $event = Webhook::constructEvent($payload, $signature, $secret);
        } catch (SignatureVerificationException $e) {
            return response()->json(['error' => 'Signature invalide.'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            /** @var \Stripe\Checkout\Session $session */
            $session = $event->data->object;
            $token   = $session->metadata->payment_token ?? null;

            if ($token) {
                Facture::where('payment_token', $token)
                    ->where('statut', '!=', Facture::STATUT_PAYEE)
                    ->update(['statut' => Facture::STATUT_PAYEE]);
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
