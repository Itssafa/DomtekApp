<?php

namespace App\Services;

use App\Models\Client;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * Provisionnement des comptes de connexion des clients.
 *
 * Principe : l'agence ne choisit ni ne connaît jamais le mot de passe.
 * Le compte est créé avec un secret aléatoire que personne ne voit, et le
 * client reçoit un lien d'activation à usage unique pour choisir le sien.
 */
class ClientAccountService
{
    /**
     * Broker dédié (fenêtre de 7 jours) — cf. config/auth.php.
     */
    private const BROKER = 'clients';

    /**
     * Créer ou rattacher le compte de connexion d'une fiche client.
     *
     * Idempotent : ne fait rien si la fiche est déjà rattachée à un compte.
     * N'envoie l'invitation que pour un compte réellement nouveau — si la
     * personne possède déjà un compte (autre agence, inscription spontanée),
     * on se contente de rattacher la fiche, son mot de passe reste le sien.
     */
    public function provision(Client $client): ?User
    {
        // Pas d'adresse e-mail : aucun moyen d'envoyer l'invitation.
        // Le cas subsiste pour les fiches historiques créées avant que
        // l'e-mail ne devienne obligatoire.
        if (blank($client->email) || $client->user_id !== null) {
            return null;
        }

        $user = User::where('email', $client->email)->first();
        $estNouveau = $user === null;

        if ($estNouveau) {
            $user = User::create([
                'name'      => $client->nom_complet,
                // Secret jamais affiché, jamais envoyé, jamais stocké en clair :
                // il n'existe que pour empêcher toute connexion avant activation.
                'password'  => Str::password(32),
                'role'      => User::ROLE_CLIENT,
                'is_active' => true,
            ]);
        }

        $client->forceFill(['user_id' => $user->id])->save();

        if ($estNouveau) {
            $this->envoyerLienActivation($client, $user);
        } else {
            // Le compte existe déjà : son mot de passe reste valable, il n'y a
            // donc rien à activer. Mais sans un mot, le client ne saurait pas
            // qu'une nouvelle agence vient d'apparaître dans son espace.
            $this->envoyerAvisRattachement($client, $user);
        }

        return $user;
    }

    /**
     * Renvoyer l'invitation (e-mail perdu, tombé dans les spams, lien expiré).
     *
     * Régénère un token neuf : l'éventuel lien précédent devient caduc.
     *
     * @throws \RuntimeException si la fiche n'a pas d'e-mail, ou si le compte
     *                           rattaché a déjà été activé.
     */
    public function renvoyerInvitation(Client $client): void
    {
        if (blank($client->email)) {
            throw new \RuntimeException("Ce client n'a pas d'adresse e-mail.");
        }

        // Fiche jamais provisionnée (créée avant cette fonctionnalité) :
        // on la provisionne maintenant, ce qui envoie l'invitation.
        if ($client->user_id === null) {
            $this->provision($client);
            return;
        }

        $this->envoyerLienActivation($client, $client->user, relance: true);
    }

    /**
     * Prévenir un client déjà titulaire d'un compte qu'une agence vient de le
     * référencer. Aucun lien d'activation ici : il se connecte comme d'habitude.
     */
    private function envoyerAvisRattachement(Client $client, User $user): void
    {
        try {
            Mail::send('emails.rattachement_agence', [
                'client'       => $client,
                'user'         => $user,
                'organisation' => $client->organisation,
                'url'          => config('services.frontend.url') . '/espace',
            ], function ($m) use ($user) {
                $m->to($user->email, $user->name)
                  ->subject('Une nouvelle agence apparaît dans votre espace client — Domtek');
            });
        } catch (\Throwable $e) {
            Log::error("Avis de rattachement client #{$client->id} échoué : " . $e->getMessage(), [
                'client_id' => $client->id,
                'user_id'   => $user->id,
            ]);
        }
    }

    /**
     * Générer le lien à usage unique et l'expédier.
     *
     * L'échec d'envoi est journalisé sans être propagé : la création d'un
     * client ou d'un contrat ne doit jamais échouer à cause du SMTP.
     * L'agence dispose du bouton « Renvoyer l'accès » pour relancer.
     */
    private function envoyerLienActivation(Client $client, User $user, bool $relance = false): void
    {
        $token = Password::broker(self::BROKER)->createToken($user);

        $url = config('services.frontend.url')
            . '/reset-password?activation=1'
            . '&token=' . $token
            . '&email=' . urlencode($user->email);

        try {
            Mail::send('emails.activation_compte', [
                'client'       => $client,
                'user'         => $user,
                'organisation' => $client->organisation,
                'url'          => $url,
            ], function ($m) use ($user) {
                $m->to($user->email, $user->name)
                  ->subject('Activez votre espace client — Domtek');
            });
        } catch (\Throwable $e) {
            Log::error("Envoi de l'invitation client #{$client->id} échoué : " . $e->getMessage(), [
                'client_id' => $client->id,
                'user_id'   => $user->id,
                'relance'   => $relance,
            ]);
        }
    }
}
