<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;

class PasswordResetController extends Controller
{
    /**
     * Envoie le lien de réinitialisation par e-mail.
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Réponse générique même si l'email n'existe pas (sécurité anti-énumération)
        if (! $user) {
            return response()->json([
                'message' => 'Si un compte existe avec cet e-mail, un lien vous a été envoyé.',
            ]);
        }

        // Générer un token et envoyer le mail manuellement
        $token = Password::createToken($user);

        $resetUrl = config('services.frontend.url')
            . '/reset-password?token=' . $token
            . '&email=' . urlencode($user->email);

        try {
            Mail::send('emails.reset_password', ['user' => $user, 'resetUrl' => $resetUrl], function ($m) use ($user) {
                $m->to($user->email, $user->name)
                  ->subject('Réinitialisation de votre mot de passe — Domtek');
            });
        } catch (\Throwable $e) {
            \Log::error('Password reset mail failed: ' . $e->getMessage());
            return response()->json(['message' => "L'envoi de l'e-mail a échoué. Veuillez réessayer plus tard."], 500);
        }

        return response()->json([
            'message' => 'Si un compte existe avec cet e-mail, un lien vous a été envoyé.',
        ]);
    }

    /**
     * Active le compte d'un client créé par son agence.
     *
     * Même mécanique que la réinitialisation, mais sur le broker « clients »
     * (fenêtre de 7 jours au lieu de 60 minutes) : le client n'a pas demandé
     * ce lien, il le découvre en consultant sa boîte mail.
     */
    public function activateClient(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::broker('clients')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password'          => Hash::make($password),
                    // L'accès au lien prouve la possession de la boîte mail.
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Votre espace client est activé. Vous pouvez vous connecter.']);
        }

        $errors = [
            Password::INVALID_TOKEN => "Ce lien d'activation est invalide ou a expiré. Demandez à votre agence de vous le renvoyer.",
            Password::INVALID_USER  => 'Aucun compte trouvé avec cette adresse e-mail.',
        ];

        return response()->json([
            'message' => $errors[$status] ?? "Erreur lors de l'activation.",
        ], 422);
    }

    /**
     * Réinitialise le mot de passe avec le token reçu par e-mail.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'                 => 'required|string',
            'email'                 => 'required|email',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
        }

        $errors = [
            Password::INVALID_TOKEN => 'Le lien est invalide ou a expiré. Veuillez en demander un nouveau.',
            Password::INVALID_USER  => 'Aucun compte trouvé avec cette adresse e-mail.',
        ];

        return response()->json([
            'message' => $errors[$status] ?? 'Erreur lors de la réinitialisation.',
        ], 422);
    }
}
