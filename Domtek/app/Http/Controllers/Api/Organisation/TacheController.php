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
        $user = auth()->user();
        return $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;
    }

    private function applyScope(\Illuminate\Database\Eloquent\Builder $q): \Illuminate\Database\Eloquent\Builder
    {
        $user = auth()->user();
        $q->where('organisation_id', $this->orgId());
        if ($user->isEmploye()) {
            $q->where('created_by', $user->id);
        }
        return $q;
    }

    public function index(Request $request): JsonResponse
    {
        $q = $this->applyScope(Tache::query());

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
        $this->applyScope(Tache::where('id', $tache->id))->firstOrFail();

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
        $this->applyScope(Tache::where('id', $tache->id))->firstOrFail();
        $tache->delete();

        return response()->json(null, 204);
    }
}
