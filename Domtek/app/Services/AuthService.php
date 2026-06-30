<?php

namespace App\Services;

use App\Models\Employe;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Inscrire une nouvelle organisation (statut: en_attente).
     *
     * @return array{user: User, organisation: Organisation}
     */
    public function registerOrganisation(array $data): array
    {
        $user = User::create(array_filter([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => $data['password'],
            'role'      => User::ROLE_ORGANISATION,
            'is_active' => true,
            'google_id' => $data['google_id'] ?? null,
            'avatar'    => $data['avatar'] ?? null,
        ], fn($v) => $v !== null));

        $organisation = Organisation::create([
            'user_id'     => $user->id,
            'nom'         => $data['nom_organisation'],
            'slug'        => $this->generateUniqueSlug($data['nom_organisation']),
            'statut'      => Organisation::STATUT_EN_ATTENTE,
            'adresse'     => $data['adresse'] ?? null,
            'ville'       => $data['ville'] ?? null,
            'telephone'   => $data['telephone'] ?? null,
            'email'       => $data['email_organisation'] ?? $data['email'],
            'description' => $data['description'] ?? null,
            'created_by'  => $user->id,
            'updated_by'  => $user->id,
        ]);

        $this->sendVerificationEmail($user);

        return compact('user', 'organisation');
    }

    /**
     * Inscrire un nouveau client et retourner son token.
     *
     * @return array{token: string, user: User}
     */
    public function registerClient(array $data): array
    {
        $user = User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => $data['password'],
            'role'      => User::ROLE_CLIENT,
            'is_active' => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return compact('token', 'user');
    }

    /**
     * Inscrire un nouvel employé (statut: en_attente, is_active=false).
     *
     * @return array{user: User, employe: Employe}
     */
    public function registerEmploye(array $data): array
    {
        $user = User::create([
            'name'      => $data['prenom'] . ' ' . $data['nom'],
            'email'     => $data['email'],
            'password'  => $data['password'],
            'role'      => User::ROLE_EMPLOYE,
            'is_active' => false,
        ]);

        $employe = Employe::create([
            'organisation_id' => $data['organisation_id'],
            'user_id'         => $user->id,
            'nom'             => $data['nom'],
            'prenom'          => $data['prenom'],
            'email'           => $data['email'],
            'date_naissance'  => $data['date_naissance'] ?? null,
            'cin'             => $data['cin'] ?? null,
            'cin_delivree_le' => $data['cin_delivree_le'] ?? null,
            'cin_delivree_a'  => $data['cin_delivree_a'] ?? 'Tunis',
            'statut'          => 'en_attente',
            'created_by'      => $user->id,
            'updated_by'      => $user->id,
        ]);

        $this->sendVerificationEmail($user);

        return compact('user', 'employe');
    }

    /**
     * Connecter un utilisateur et retourner ses informations + token.
     *
     * @throws ValidationException
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        return [
            'user'  => $user,
            'token' => $user->createToken('auth_token')->plainTextToken,
        ];
    }

    /**
     * Révoquer le token courant de l'utilisateur.
     */
    public function logout(\Laravel\Sanctum\PersonalAccessToken $token): void
    {
        $token->delete();
    }

    /**
     * Envoyer l'email de vérification à l'utilisateur.
     */
    public function sendVerificationEmail(User $user): void
    {
        $frontendUrl = config('services.frontend.url', 'http://localhost');

        $token = hash_hmac('sha256', $user->email . $user->created_at, config('app.key'));

        $verifyUrl = $frontendUrl . '/verify-email?' . http_build_query([
            'token' => $token,
            'email' => $user->email,
        ]);

        try {
            Mail::send('emails.verify_email', ['user' => $user, 'verifyUrl' => $verifyUrl], function ($m) use ($user) {
                $m->to($user->email)
                  ->subject('Vérifiez votre adresse e-mail — Domtek');
            });
        } catch (\Throwable $e) {
            \Log::error('Verification email failed: ' . $e->getMessage());
        }
    }

    /**
     * Vérifier le token et marquer l'email comme vérifié.
     */
    public function verifyEmail(string $email, string $token): bool
    {
        $user = User::where('email', $email)->first();

        if (!$user) return false;

        $expected = hash_hmac('sha256', $user->email . $user->created_at, config('app.key'));

        if (!hash_equals($expected, $token)) return false;

        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        return true;
    }

    /**
     * Générer un slug unique pour une organisation.
     */
    public function generateUniqueSlug(string $name): string
    {
        $slug = Str::slug($name);
        $original = $slug;
        $count = 1;

        while (Organisation::where('slug', $slug)->exists()) {
            $slug = $original . '-' . $count++;
        }

        return $slug;
    }
}
