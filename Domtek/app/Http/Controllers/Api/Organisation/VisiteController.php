<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreVisiteRequest;
use App\Http\Resources\VisiteResource;
use App\Models\Employe;
use App\Models\Visite;
use App\Services\VisiteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VisiteController extends Controller
{
    public function __construct(private VisiteService $service) {}

    private function orgId(): int
    {
        $user = auth()->user();
        return $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $user    = auth()->user();
        $filters = $request->only(['statut', 'prospect_id', 'per_page']);

        if ($user->isEmploye()) {
            $filters['employe_id'] = $user->employe->id;
        }

        return VisiteResource::collection(
            $this->service->index($this->orgId(), $filters)
        );
    }

    public function store(StoreVisiteRequest $request): VisiteResource
    {
        $data = $request->validated();

        if (auth()->user()->isEmploye()) {
            $employe = auth()->user()->employe;
            $data['employe_id'] = $employe->id;
            $data['nom_agent']  = "{$employe->prenom} {$employe->nom}";
        } elseif (!empty($data['employe_id']) && empty($data['nom_agent'])) {
            $emp = Employe::find($data['employe_id']);
            if ($emp) $data['nom_agent'] = "{$emp->prenom} {$emp->nom}";
        }

        return new VisiteResource(
            $this->service->store($this->orgId(), $data)
        );
    }

    public function show(Visite $visite): VisiteResource
    {
        $this->authorize('view', $visite);
        $visite->load(['prospect', 'bien', 'employe']);
        return new VisiteResource($visite);
    }

    public function update(Request $request, Visite $visite): VisiteResource
    {
        $this->authorize('update', $visite);
        $data = $request->validate([
            'prospect_id' => ['sometimes', 'integer', 'exists:prospects,id'],
            'bien_id'     => ['sometimes', 'integer', 'exists:biens,id'],
            'employe_id'  => ['sometimes', 'nullable', 'integer', 'exists:employes,id'],
            'nom_agent'   => ['sometimes', 'nullable', 'string', 'max:255'],
            'date_visite' => ['sometimes', 'date'],
            'statut'      => ['sometimes', 'in:planifiee,effectuee,annulee'],
            'notes'       => ['nullable', 'string'],
        ]);

        if (isset($data['employe_id']) && empty($data['nom_agent'])) {
            $emp = Employe::find($data['employe_id']);
            if ($emp) $data['nom_agent'] = "{$emp->prenom} {$emp->nom}";
        }

        return new VisiteResource($this->service->update($visite, $data));
    }

    public function destroy(Visite $visite): JsonResponse
    {
        $this->authorize('delete', $visite);
        $this->service->destroy($visite);
        return response()->json(['message' => 'Visite supprimée.']);
    }

    public function employes(): JsonResponse
    {
        $employes = Employe::where('organisation_id', $this->orgId())
            ->whereIn('statut', ['actif', 'en_attente'])
            ->get(['id', 'nom', 'prenom']);

        return response()->json(['data' => $employes->map(fn($e) => [
            'id'  => $e->id,
            'nom' => "{$e->prenom} {$e->nom}",
        ])]);
    }
}
