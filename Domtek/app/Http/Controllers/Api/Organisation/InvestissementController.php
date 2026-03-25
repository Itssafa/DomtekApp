<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreInvestissementRequest;
use App\Http\Requests\Org\UpdateInvestissementRequest;
use App\Http\Resources\TauxInvestissementResource;
use App\Models\TauxInvestissement;
use App\Services\InvestissementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvestissementController extends Controller
{
    public function __construct(private InvestissementService $service) {}

    private function orgId(): int
    {
        return auth()->user()->organisation->id;
    }

    public function index(): AnonymousResourceCollection
    {
        return TauxInvestissementResource::collection(
            $this->service->index($this->orgId())
        );
    }

    public function store(StoreInvestissementRequest $request): TauxInvestissementResource
    {
        return new TauxInvestissementResource(
            $this->service->store($this->orgId(), $request->validated())
        );
    }

    public function show(TauxInvestissement $investissement): TauxInvestissementResource
    {
        $this->authorize('view', $investissement);

        return new TauxInvestissementResource($investissement);
    }

    public function update(UpdateInvestissementRequest $request, TauxInvestissement $investissement): TauxInvestissementResource
    {
        $this->authorize('update', $investissement);

        return new TauxInvestissementResource(
            $this->service->update($investissement, $request->validated())
        );
    }

    public function destroy(TauxInvestissement $investissement): JsonResponse
    {
        $this->authorize('delete', $investissement);
        $this->service->destroy($investissement);

        return response()->json(['message' => 'Taux supprimé.']);
    }
}
