<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreEmployeRequest;
use App\Http\Requests\Org\UpdateEmployeRequest;
use App\Http\Resources\EmployeResource;
use App\Models\Employe;
use App\Services\EmployeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmployeController extends Controller
{
    public function __construct(private EmployeService $service) {}

    private function orgId(): int
    {
        return auth()->user()->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return EmployeResource::collection(
            $this->service->index($this->orgId(), $request->only(['statut', 'search', 'per_page']))
        );
    }

    public function store(StoreEmployeRequest $request): EmployeResource
    {
        return new EmployeResource(
            $this->service->store($this->orgId(), $request->validated())
        );
    }

    public function show(Employe $employe): EmployeResource
    {
        $this->authorize('view', $employe);

        return new EmployeResource($employe);
    }

    public function update(UpdateEmployeRequest $request, Employe $employe): EmployeResource
    {
        $this->authorize('update', $employe);

        return new EmployeResource(
            $this->service->update($employe, $request->validated())
        );
    }

    public function destroy(Employe $employe): JsonResponse
    {
        $this->authorize('delete', $employe);
        $this->service->destroy($employe);

        return response()->json(['message' => 'Employé supprimé.']);
    }
}
