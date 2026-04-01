<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreProspectRequest;
use App\Http\Requests\Org\UpdateProspectRequest;
use App\Http\Resources\ProspectResource;
use App\Models\Prospect;
use App\Services\ProspectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProspectController extends Controller
{
    public function __construct(private ProspectService $service) {}

    private function orgId(): int
    {
        return auth()->user()->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return ProspectResource::collection(
            $this->service->index($this->orgId(), $request->only(['search', 'per_page']))
        );
    }

    public function store(StoreProspectRequest $request): ProspectResource
    {
        return new ProspectResource(
            $this->service->store($this->orgId(), $request->validated())
        );
    }

    public function show(Prospect $prospect): ProspectResource
    {
        $this->authorize('view', $prospect);

        return new ProspectResource($prospect);
    }

    public function update(UpdateProspectRequest $request, Prospect $prospect): ProspectResource
    {
        $this->authorize('update', $prospect);

        return new ProspectResource(
            $this->service->update($prospect, $request->validated())
        );
    }

    public function uploadDocument(Request $request, Prospect $prospect): ProspectResource
    {
        $this->authorize('update', $prospect);
        $request->validate([
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        return new ProspectResource(
            $this->service->uploadDocument($prospect, $request->file('document'))
        );
    }

    public function destroy(Prospect $prospect): JsonResponse
    {
        $this->authorize('delete', $prospect);
        $this->service->destroy($prospect);

        return response()->json(['message' => 'Prospect supprimé.']);
    }
}
