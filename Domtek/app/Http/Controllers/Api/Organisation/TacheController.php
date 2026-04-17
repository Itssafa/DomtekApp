<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Models\Tache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TacheController extends Controller
{
    private function orgId(): int
    {
        return auth()->user()->organisation->id;
    }

    public function index(Request $request): JsonResponse
    {
        $q = Tache::where('organisation_id', $this->orgId());

        if ($request->statut) {
            $q->where('statut', $request->statut);
        }

        $taches = $q->orderByRaw("FIELD(statut, 'a_faire', 'en_cours', 'terminee')")
                    ->orderByRaw("FIELD(priorite, 'haute', 'normale', 'basse')")
                    ->orderBy('date_echeance')
                    ->get();

        return response()->json(['data' => $taches]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'titre'         => ['required', 'string', 'max:255'],
            'description'   => ['nullable', 'string'],
            'date_echeance' => ['nullable', 'date'],
            'priorite'      => ['sometimes', 'in:basse,normale,haute'],
        ]);

        $tache = Tache::create(array_merge($data, [
            'organisation_id' => $this->orgId(),
            'statut'          => 'a_faire',
        ]));

        return response()->json(['data' => $tache], 201);
    }

    public function update(Request $request, Tache $tache): JsonResponse
    {
        abort_if((int) $tache->organisation_id !== $this->orgId(), 403);

        $data = $request->validate([
            'titre'         => ['sometimes', 'string', 'max:255'],
            'description'   => ['nullable', 'string'],
            'date_echeance' => ['nullable', 'date'],
            'statut'        => ['sometimes', 'in:a_faire,en_cours,terminee'],
            'priorite'      => ['sometimes', 'in:basse,normale,haute'],
        ]);

        $tache->update($data);

        return response()->json(['data' => $tache]);
    }

    public function destroy(Tache $tache): JsonResponse
    {
        abort_if((int) $tache->organisation_id !== $this->orgId(), 403);
        $tache->delete();

        return response()->json(null, 204);
    }
}
