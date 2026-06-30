<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Redirige l'utilisateur vers la page de connexion Google.
     * ?intent=organisation → flux d'inscription organisation
     */
    public function redirectToGoogle(Request $request)
    {
        $intent = $request->get('intent', 'client');

        return Socialite::driver('google')
            ->stateless()
            ->with(['state' => $intent])
            ->redirect();
    }

    /**
     * Traite le retour de Google et connecte / crée l'utilisateur.
     * Redirige vers le frontend avec un token Sanctum en query param.
     */
    public function handleGoogleCallback(Request $request)
    {
        $frontendUrl = config('services.frontend.url');
        $intent      = $request->get('state', 'client');

        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->setHttpClient(new \GuzzleHttp\Client(['verify' => false]))
                ->user();
        } catch (\Throwable $e) {
            \Log::error('Google OAuth callback failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return redirect("{$frontendUrl}/login?error=google_failed");
        }

        // ── Flux inscription organisation ──────────────────────────────────────
        if ($intent === 'organisation') {
            $token = Crypt::encryptString(json_encode([
                'name'      => $googleUser->getName(),
                'email'     => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar'    => $googleUser->getAvatar(),
                'expires'   => now()->addMinutes(30)->timestamp,
            ]));

            return redirect("{$frontendUrl}/register/organisation?" . http_build_query(['g' => $token]));
        }

        // Chercher par google_id d'abord, puis par email
        $existing = User::where('google_id', $googleUser->getId())->first()
            ?? User::where('email', $googleUser->getEmail())->first();

        // Nouvel utilisateur → rediriger vers la page de choix du type de compte
        if (! $existing) {
            $token = Crypt::encryptString(json_encode([
                'name'      => $googleUser->getName(),
                'email'     => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar'    => $googleUser->getAvatar(),
                'expires'   => now()->addMinutes(30)->timestamp,
            ]));

            return redirect("{$frontendUrl}/register/choix?" . http_build_query(['g' => $token]));
        }

        try {
            $user = DB::transaction(function () use ($googleUser, $existing) {
                $existing->update([
                    'google_id' => $googleUser->getId(),
                    'avatar'    => $googleUser->getAvatar(),
                ]);
                return $existing;
            });
        } catch (\Throwable $e) {
            \Log::error('Google OAuth error: ' . $e->getMessage());
            return redirect("{$frontendUrl}/login?error=google_failed");
        }

        // Refuser les comptes inactifs (employés)
        if (! $user->is_active) {
            return redirect("{$frontendUrl}/login?error=account_disabled");
        }

        // Refuser les organisations en attente ou inactives
        if ($user->role === User::ROLE_ORGANISATION) {
            $org = $user->organisation;
            if (!$org) {
                return redirect("{$frontendUrl}/login?error=google_failed");
            }
            if ($org->statut === \App\Models\Organisation::STATUT_EN_ATTENTE) {
                return redirect("{$frontendUrl}/en-attente");
            }
            if ($org->statut === \App\Models\Organisation::STATUT_INACTIVE) {
                return redirect("{$frontendUrl}/login?error=account_disabled");
            }
        }

        $token = $user->createToken('google-oauth')->plainTextToken;

        $orgSlug = null;
        if ($user->role === User::ROLE_ORGANISATION) {
            $orgSlug = $user->organisation?->slug;
        } elseif ($user->role === User::ROLE_EMPLOYE) {
            $orgSlug = $user->employe?->organisation?->slug;
        }

        $params = http_build_query(array_filter([
            'token'    => $token,
            'role'     => $user->role,
            'name'     => $user->name,
            'email'    => $user->email,
            'org_slug' => $orgSlug,
        ]));

        return redirect("{$frontendUrl}/auth/google/callback?{$params}");
    }

    /**
     * Déchiffre le token Google temporaire et retourne nom + email (sans données sensibles).
     */
    public function prefillFromToken(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        try {
            $data = json_decode(Crypt::decryptString($request->token), true);
        } catch (\Throwable) {
            return response()->json(['message' => 'Token invalide.'], 422);
        }

        if (($data['expires'] ?? 0) < now()->timestamp) {
            return response()->json(['message' => 'Le lien a expiré.'], 422);
        }

        return response()->json([
            'name'  => $data['name'],
            'email' => $data['email'],
        ]);
    }
}
