<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Vérifie que l'utilisateur authentifié possède l'un des rôles autorisés.
     * Usage : middleware('role:admin') ou middleware('role:admin,organisation')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Accès non autorisé.',
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Votre compte est désactivé.',
            ], 403);
        }

        return $next($request);
    }
}
