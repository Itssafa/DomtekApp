<?php

namespace App\Services;

use App\Mail\FactureCreee;
use App\Models\Client;
use App\Models\Facture;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class FactureService
{
    private static array $typeLabels = [
        Facture::TYPE_EAU             => 'eau',
        Facture::TYPE_ELECTRICITE_GAZ => 'électricité et gaz',
        Facture::TYPE_LOYER           => 'loyer',
        Facture::TYPE_ELECTRICITE     => 'électricité',
        Facture::TYPE_GAZ             => 'gaz',
    ];
    /**
     * Liste paginée des factures d'une organisation avec filtres optionnels.
     */
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        $query = Facture::where('organisation_id', $orgId)
            ->with(['client', 'contrat']);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }
        if (!empty($filters['client_id'])) {
            $query->where('client_id', $filters['client_id']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);
        return $query->latest()->paginate($perPage);
    }

    /**
     * Créer une nouvelle facture pour un client de l'organisation.
     */
    public function store(int $orgId, array $data): Facture
    {
        Client::where('id', $data['client_id'])
            ->where('organisation_id', $orgId)
            ->firstOrFail();

        $data['organisation_id'] = $orgId;
        $data['payment_token']   = Str::uuid()->toString();

        /** @var Facture $facture */
        $facture = Facture::create($data)->load(['client', 'contrat.bien', 'organisation']);

        $this->envoyerSmsFacture($facture);
        $this->envoyerEmailFacture($facture);

        return $facture;
    }

    /**
     * Envoie un SMS de notification au client lors de la création d'une facture.
     */
    private function envoyerSmsFacture(Facture $facture): void
    {
        $client = $facture->client;

        if (!$client || empty($client->telephone)) {
            return;
        }

        $typeLabel  = self::$typeLabels[$facture->type] ?? $facture->type;
        $montant    = number_format((float) $facture->montant, 2, ',', ' ');
        $echeance   = $facture->date_echeance->format('d/m/Y');
        $reference  = $facture->reference ? " (Réf: {$facture->reference})" : '';
        $bien       = $facture->contrat?->bien?->titre;
        $bienInfo   = $bien ? " — Bien : {$bien}" : '';

        $message = "Bonjour {$client->prenom},\n"
            . "Une nouvelle facture de {$typeLabel}{$bienInfo} vous a été émise{$reference}.\n"
            . "Montant : {$montant} TND — À régler avant le {$echeance}.";

        try {
            app(SmsService::class)->send($client->telephone, $message);
        } catch (\Throwable $e) {
            Log::warning('SMS facture non envoyé : ' . $e->getMessage());
        }
    }

    /**
     * Envoie un e-mail au client avec la facture en PDF et un bouton de paiement Stripe.
     */
    private function envoyerEmailFacture(Facture $facture): void
    {
        $client = $facture->client;

        if (!$client || empty($client->email)) {
            return;
        }

        $paymentUrl = config('app.url') . '/api/pay/' . $facture->payment_token;

        try {
            Mail::to($client->email)->send(new FactureCreee($facture, $paymentUrl));
        } catch (\Throwable $e) {
            Log::warning('Email facture non envoyé : ' . $e->getMessage());
        }
    }

    /**
     * Mettre à jour une facture existante.
     */
    public function update(Facture $facture, array $data): Facture
    {
        $facture->update($data);
        return $facture;
    }

    /**
     * Marquer une facture comme payée.
     */
    public function marquerPayee(Facture $facture): Facture
    {
        $facture->update(['statut' => Facture::STATUT_PAYEE]);
        return $facture;
    }

    /**
     * Supprimer une facture.
     */
    public function destroy(Facture $facture): void
    {
        $facture->delete();
    }
}
