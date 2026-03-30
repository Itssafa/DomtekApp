<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreVisiteRequest;
use App\Http\Resources\VisiteResource;
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
        return auth()->user()->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return VisiteResource::collection(
            $this->service->index($this->orgId(), $request->only([
                'statut', 'client_id', 'per_page',
            ]))
        );
    }

    public function store(StoreVisiteRequest $request): VisiteResource
    {
        return new VisiteResource(
            $this->service->store($this->orgId(), $request->validated())
        );
    }

    public function show(Visite $visite): VisiteResource
    {
        $this->authorize('view', $visite);
        $visite->load(['client', 'bien']);
        return new VisiteResource($visite);
    }

    public function update(Request $request, Visite $visite): VisiteResource
    {
        $this->authorize('update', $visite);
        $data = $request->validate([
            'client_id'   => ['sometimes', 'integer', 'exists:clients,id'],
            'bien_id'     => ['sometimes', 'integer', 'exists:biens,id'],
            'nom_agent'   => ['sometimes', 'string', 'max:255'],
            'date_visite' => ['sometimes', 'date'],
            'statut'      => ['sometimes', 'in:planifiee,effectuee,annulee'],
            'notes'       => ['nullable', 'string'],
        ]);
        return new VisiteResource($this->service->update($visite, $data));
    }

    public function destroy(Visite $visite): JsonResponse
    {
        $this->authorize('delete', $visite);
        $this->service->destroy($visite);
        return response()->json(['message' => 'Visite supprimée.']);
    }
}
