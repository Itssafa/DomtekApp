<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreEtatLieuRequest;
use App\Http\Requests\Org\UpdateEtatLieuRequest;
use App\Http\Resources\EtatLieuResource;
use App\Models\EtatLieu;
use App\Services\EtatLieuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EtatLieuController extends Controller
{
    public function __construct(private EtatLieuService $service) {}

    private function orgId(): int
    {
        return auth()->user()->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return EtatLieuResource::collection(
            $this->service->index($this->orgId(), $request->only([
                'type', 'contrat_id', 'per_page',
            ]))
        );
    }

    public function store(StoreEtatLieuRequest $request): EtatLieuResource
    {
        return new EtatLieuResource(
            $this->service->store($this->orgId(), $request->validated())
        );
    }

    public function show(EtatLieu $etatLieu): EtatLieuResource
    {
        $this->authorize('view', $etatLieu);
        $etatLieu->load(['contrat.bien', 'contrat.clients']);
        return new EtatLieuResource($etatLieu);
    }

    public function update(UpdateEtatLieuRequest $request, EtatLieu $etatLieu): EtatLieuResource
    {
        $this->authorize('update', $etatLieu);
        return new EtatLieuResource(
            $this->service->update($etatLieu, $request->validated())
        );
    }

    public function destroy(EtatLieu $etatLieu): JsonResponse
    {
        $this->authorize('delete', $etatLieu);
        $this->service->destroy($etatLieu);
        return response()->json(['message' => 'État des lieux supprimé.']);
    }
}
