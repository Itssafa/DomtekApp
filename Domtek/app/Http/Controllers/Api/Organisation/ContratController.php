<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreContratRequest;
use App\Http\Requests\Org\UpdateContratRequest;
use App\Http\Resources\ContratResource;
use App\Models\Contrat;
use App\Services\ContratService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ContratController extends Controller
{
    public function __construct(private ContratService $service) {}

    private function orgId(): int
    {
        return auth()->user()->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return ContratResource::collection(
            $this->service->index($this->orgId(), $request->only([
                'type', 'statut', 'client_id', 'per_page',
            ]))
        );
    }

    public function store(StoreContratRequest $request): ContratResource
    {
        return new ContratResource(
            $this->service->store($this->orgId(), $request->validated())
        );
    }

    public function show(Contrat $contrat): ContratResource
    {
        $this->authorize('view', $contrat);
        $contrat->load(['bien.images', 'clients', 'factures']);

        return new ContratResource($contrat);
    }

    public function update(UpdateContratRequest $request, Contrat $contrat): ContratResource
    {
        $this->authorize('update', $contrat);

        return new ContratResource(
            $this->service->update($contrat, $request->validated())
        );
    }

    public function destroy(Contrat $contrat): JsonResponse
    {
        $this->authorize('delete', $contrat);
        $this->service->destroy($contrat);

        return response()->json(['message' => 'Contrat supprimé.']);
    }

    public function uploadFichier(Request $request, Contrat $contrat): JsonResponse
    {
        $this->authorize('update', $contrat);

        $request->validate([
            'fichier' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        $this->service->uploadFichier($contrat, $request->file('fichier'), $this->orgId());

        return response()->json(['message' => 'Fichier uploadé.', 'fichier' => $contrat->fichier]);
    }
}
