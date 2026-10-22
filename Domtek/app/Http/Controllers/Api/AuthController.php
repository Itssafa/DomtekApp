<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterClientRequest;
use App\Http\Requests\Auth\RegisterEmployeRequest;
use App\Http\Requests\Auth\RegisterOrganisationRequest;
use App\Models\Organisation;
use App\Rules\TelephoneTunisien;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(private AuthService $service) {}

    /**
     * Inscription d'une organisation (agence immobilière).
     * Le compte est créé en statut "en_attente" jusqu'à activation par l'admin.
     */
    public function registerOrganisation(RegisterOrganisationRequest $request): JsonResponse
    {
        $result = $this->service->registerOrganisation($request->validated());

        return response()->json([
            'message'      => "Compte créé avec succès. En attente d'activation par un administrateur.",
            'user'         => $result['user'],
            'organisation' => $result['organisation'],
        ], 201);
    }

    /**
     * Inscription d'un employé — compte inactif, en attente d'activation par l'organisation.
     */
    public function registerEmploye(RegisterEmployeRequest $request): JsonResponse
    {
        $result = $this->service->registerEmploye($request->validated());

        return response()->json([
            'message' => "Compte créé avec succès. En attente d'activation par l'organisation.",
            'user'    => $result['user'],
            'employe' => $result['employe'],
        ], 201);
    }

    /**
     * Inscription d'un client (simple utilisateur).
     */
    public function registerClient(RegisterClientRequest $request): JsonResponse
    {
        $result = $this->service->registerClient($request->validated());

        return response()->json([
            'message' => 'Inscription réussie.',
            'token'   => $result['token'],
            'user'    => $result['user'],
            'role'    => $result['user']->role,
        ], 201);
    }

    /**
     * Inscription organisation via Google OAuth (2e étape).
     * Reçoit le token chiffré Google + les infos de l'organisation.
     */
    public function registerOrganisationGoogle(Request $request): JsonResponse
    {
        $request->validate([
            'google_token'       => ['required', 'string'],
            'nom_organisation'   => ['required', 'string', 'max:255'],
            'ville'              => ['nullable', 'string', 'max:100'],
            'telephone'          => ['nullable', 'string', 'max:20', new TelephoneTunisien],
            'email_organisation' => ['nullable', 'email', 'max:255'],
            'description'        => ['nullable', 'string'],
        ]);

        // Déchiffrer et vérifier le token Google
        try {
            $google = json_decode(Crypt::decryptString($request->google_token), true);
        } catch (\Throwable) {
            return response()->json(['message' => 'Token Google invalide ou expiré.'], 422);
        }

        if (($google['expires'] ?? 0) < now()->timestamp) {
            return response()->json(['message' => 'Le lien Google a expiré. Recommencez.'], 422);
        }

        // Chercher un utilisateur existant avec ce mail ou ce google_id
        $existingUser = User::where('email', $google['email'])->first()
            ?? ($google['google_id'] ? User::where('google_id', $google['google_id'])->first() : null);

        if ($existingUser) {
            // Bloquer si c'est déjà une organisation ou un employé
            if ($existingUser->role !== User::ROLE_CLIENT) {
                return response()->json(['message' => 'Un compte existe déjà avec cette adresse Google.'], 422);
            }

            // Compte CLIENT créé automatiquement → convertir en organisation
            $existingUser->update([
                'role'              => User::ROLE_ORGANISATION,
                'google_id'         => $google['google_id'],
                'avatar'            => $google['avatar'] ?? null,
                'email_verified_at' => now(),
            ]);

            $organisation = Organisation::create([
                'user_id'     => $existingUser->id,
                'nom'         => $request->nom_organisation,
                'slug'        => $this->service->generateUniqueSlug($request->nom_organisation),
                'statut'      => Organisation::STATUT_EN_ATTENTE,
                'ville'       => $request->ville ?? null,
                'telephone'   => $request->telephone ?? null,
                'email'       => $request->email_organisation ?? $existingUser->email,
                'description' => $request->description ?? null,
                'created_by'  => $existingUser->id,
                'updated_by'  => $existingUser->id,
            ]);

            return response()->json([
                'message'      => "Compte créé avec succès. En attente d'activation par un administrateur.",
                'user'         => $existingUser->fresh(),
                'organisation' => $organisation,
            ], 201);
        }

        // Nouveau compte → flux normal
        $result = $this->service->registerOrganisation(array_merge($request->only(
            'nom_organisation', 'ville', 'telephone', 'email_organisation', 'description'
        ), [
            'name'      => $google['name'],
            'email'     => $google['email'],
            'password'  => Str::random(32),
            'google_id' => $google['google_id'],
            'avatar'    => $google['avatar'] ?? null,
        ]));

        // Email déjà vérifié par Google
        $result['user']->update(['email_verified_at' => now()]);

        return response()->json([
            'message'      => "Compte créé avec succès. En attente d'activation par un administrateur.",
            'user'         => $result['user'],
            'organisation' => $result['organisation'],
        ], 201);
    }

    /**
     * Inscription client via Google OAuth (depuis la page de choix).
     */
    public function registerClientGoogle(Request $request): JsonResponse
    {
        $request->validate(['google_token' => 'required|string']);

        try {
            $google = json_decode(Crypt::decryptString($request->google_token), true);
        } catch (\Throwable) {
            return response()->json(['message' => 'Token Google invalide ou expiré.'], 422);
        }

        if (($google['expires'] ?? 0) < now()->timestamp) {
            return response()->json(['message' => 'Le lien Google a expiré. Recommencez.'], 422);
        }

        if (User::where('email', $google['email'])->exists()) {
            return response()->json(['message' => 'Un compte existe déjà avec cette adresse Google.'], 422);
        }

        $user = User::create([
            'name'              => $google['name'],
            'email'             => $google['email'],
            'password'          => Str::random(32),
            'google_id'         => $google['google_id'],
            'avatar'            => $google['avatar'] ?? null,
            'role'              => User::ROLE_CLIENT,
            'is_active'         => true,
            'email_verified_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
            'role'  => $user->role,
        ], 201);
    }

    /**
     * Vérifier l'adresse e-mail via le lien reçu par mail.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
        ]);

        $verified = $this->service->verifyEmail($request->email, $request->token);

        if (!$verified) {
            return response()->json(['message' => 'Lien de vérification invalide ou expiré.'], 422);
        }

        return response()->json(['message' => 'Adresse e-mail vérifiée avec succès.']);
    }

    /**
     * Connexion — retourne un token Sanctum + le rôle de l'utilisateur.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->service->login($request->email, $request->password);
        $user = $result['user'];

        if (!$user->is_active) {
            // Employee pending activation
            if ($user->isEmploye()) {
                return response()->json([
                    'message' => "Votre compte est en attente d'activation par votre organisation.",
                    'statut'  => 'en_attente',
                ], 403);
            }
            return response()->json([
                'message' => "Votre compte a été désactivé. Contactez l'administrateur.",
            ], 403);
        }

        $responseData = [
            'token' => $result['token'],
            'user'  => $user,
            'role'  => $user->role,
        ];

        if ($user->isOrganisation()) {
            $organisation = $user->organisation;

            if (!$organisation) {
                return response()->json(['message' => 'Organisation introuvable.'], 404);
            }

            if ($organisation->statut === Organisation::STATUT_EN_ATTENTE) {
                return response()->json([
                    'message'      => "Votre compte est en attente d'activation par un administrateur.",
                    'statut'       => 'en_attente',
                    'organisation' => $organisation,
                ], 403);
            }

            if ($organisation->statut === Organisation::STATUT_INACTIVE) {
                return response()->json([
                    'message' => 'Votre compte organisation a été désactivé.',
                    'statut'  => 'inactive',
                ], 403);
            }

            $responseData['organisation'] = $organisation;
        }

        if ($user->isEmploye()) {
            $employe = $user->employe;
            if ($employe) {
                $responseData['organisation'] = $employe->organisation;
                $responseData['employe']      = $employe;
            }
        }

        return response()->json($responseData);
    }

    /**
     * Déconnexion — révoque le token courant.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->service->logout($request->user()->currentAccessToken());

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    /**
     * Retourne l'utilisateur authentifié avec ses informations liées.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = ['user' => $user, 'role' => $user->role];

        if ($user->isOrganisation()) {
            $data['organisation'] = $user->organisation;
        }


        if ($user->isEmploye()) {
            $employe = $user->employe;
            if ($employe) {
                $data['organisation'] = $employe->organisation;
                $data['employe']      = $employe;
            }
        }

        return response()->json($data);
    }
}
