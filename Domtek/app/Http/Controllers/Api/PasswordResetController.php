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

        Mail::send('emails.reset_password', ['user' => $user, 'resetUrl' => $resetUrl], function ($m) use ($user) {
            $m->to($user->email, $user->name)
              ->subject('Réinitialisation de votre mot de passe — Domtek');
        });

        return response()->json([
            'message' => 'Si un compte existe avec cet e-mail, un lien vous a été envoyé.',
        ]);
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
