<?php

namespace App\Observers;

use App\Models\Client;
use App\Services\ClientAccountService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Log;

/**
 * Provisionne automatiquement le compte de connexion d'un client.
 *
 * Passer par un observer plutôt que par les services garantit une couverture
 * complète : une fiche client naît aujourd'hui à trois endroits distincts
 * (ClientService::store, et les cas « conversion de prospect » et
 * « nouveau client inline » de ContratService::store).
 *
 * ShouldHandleEventsAfterCommit : la création d'un client via un contrat se
 * déroule dans une transaction. Sans cela, un contrat annulé plus loin dans
 * la transaction aurait déjà déclenché l'envoi de l'invitation.
 */
class ClientObserver implements ShouldHandleEventsAfterCommit
{
    public function __construct(private ClientAccountService $comptes) {}

    public function created(Client $client): void
    {
        $this->provisionnerSansRompre($client);
    }

    /**
     * Rattrapage : fiche créée sans e-mail (avant que celui-ci ne devienne
     * obligatoire) à laquelle l'agence en renseigne un plus tard.
     */
    public function updated(Client $client): void
    {
        if ($client->user_id === null && filled($client->email)) {
            $this->provisionnerSansRompre($client);
        }
    }

    /**
     * L'événement étant émis après le COMMIT, la fiche client est déjà
     * enregistrée quand on arrive ici : une exception ne l'annulerait pas, elle
     * se contenterait de renvoyer une erreur 500 à l'agence pour une fiche
     * pourtant créée. On journalise donc au lieu de propager — l'agence garde
     * son client, et le bouton « Renvoyer l'accès » permet de rattraper.
     */
    private function provisionnerSansRompre(Client $client): void
    {
        try {
            $this->comptes->provision($client);
        } catch (\Throwable $e) {
            Log::error("Provisionnement du compte client #{$client->id} échoué : " . $e->getMessage(), [
                'client_id' => $client->id,
                'email'     => $client->email,
            ]);
        }
    }
}
