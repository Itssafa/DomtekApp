<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreClientRequest;
use App\Http\Requests\Org\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Services\ClientAccountService;
use App\Services\ClientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    public function __construct(
        private ClientService $service,
        private ClientAccountService $comptes,
    ) {}

    private function orgId(): int
    {
        $user = auth()->user();
        return $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return ClientResource::collection(
            $this->service->index($this->orgId(), $request->only(['search', 'per_page']))
        );
    }

    public function store(StoreClientRequest $request): ClientResource
    {
        return new ClientResource(
            $this->service->store($this->orgId(), $request->validated())
        );
    }

    public function show(Client $client): ClientResource
    {
        $this->authorize('view', $client);
        $client->load(['contrats.bien', 'factures', 'user']);

        return new ClientResource($client);
    }

    /**
     * Renvoyer au client son lien d'activation (spam, e-mail perdu, lien expiré).
     */
    public function renvoyerAcces(Client $client): JsonResponse
    {
        $this->authorize('update', $client);

        try {
            $this->comptes->renvoyerInvitation($client);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => "Un lien d'activation a été envoyé à {$client->email}.",
        ]);
    }

    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        $this->authorize('update', $client);

        return new ClientResource(
            $this->service->update($client, $request->validated())
        );
    }

    public function uploadDocument(Request $request, Client $client): ClientResource
    {
        $this->authorize('update', $client);
        $request->validate([
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        return new ClientResource(
            $this->service->uploadDocument($client, $request->file('document'))
        );
    }

    public function destroy(Client $client): JsonResponse
    {
        $this->authorize('delete', $client);
        $this->service->destroy($client);

        return response()->json(['message' => 'Client supprimé.']);
    }
}
