<?php

namespace App\Services;

use App\Models\Organisation;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
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
        $user = User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => $data['password'],
            'role'      => User::ROLE_ORGANISATION,
            'is_active' => true,
        ]);

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
