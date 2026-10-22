<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Rules\TelephoneTunisien;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Mise à jour de l'email de l'utilisateur connecté.
     */
    public function updateUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $request->user()->id],
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Informations mises à jour.',
            'user'    => $request->user()->fresh(),
        ]);
    }

    /**
     * Changement du mot de passe.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password'      => ['required', 'string'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'errors' => ['current_password' => ['Le mot de passe actuel est incorrect.']],
            ], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }

    /**
     * Mise à jour des informations de l'organisation (rôle organisation uniquement).
     * Champs modifiables : email, telephone, ville, description, logo.
     * Champs non modifiables : nom, adresse (ignorés).
     */
    public function updateOrganisation(Request $request): JsonResponse
    {
        $user = $request->user();
        $org  = $user->organisation;

        if (! $org) {
            return response()->json(['message' => 'Organisation introuvable.'], 404);
        }

        $validated = $request->validate([
            'email'       => ['nullable', 'email', 'max:255'],
            'telephone'   => ['nullable', 'string', 'max:20', new TelephoneTunisien],
            'ville'       => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'logo'        => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($request->hasFile('logo')) {
            if ($org->logo) {
                Storage::disk('public')->delete($org->logo);
            }
            $validated['logo'] = $request->file('logo')->store('logos', 'public');
        } else {
            unset($validated['logo']);
        }

        $org->update($validated);

        return response()->json([
            'message'      => 'Organisation mise à jour.',
            'organisation' => $org->fresh(),
        ]);
    }
}
