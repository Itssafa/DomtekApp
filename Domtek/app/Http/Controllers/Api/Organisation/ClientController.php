<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreClientRequest;
use App\Http\Requests\Org\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Services\ClientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    public function __construct(private ClientService $service) {}

    private function orgId(): int
    {
        return auth()->user()->organisation->id;
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
        $client->load(['contrats.bien', 'factures']);

        return new ClientResource($client);
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
