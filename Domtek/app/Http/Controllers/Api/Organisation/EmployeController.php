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
use Illuminate\Support\Facades\DB;

class EmployeController extends Controller
{
    public function __construct(private EmployeService $service) {}

    private function orgId(): int
    {
        $user = auth()->user();
        return $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;
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

    public function enAttente(): AnonymousResourceCollection
    {
        $employes = Employe::where('organisation_id', $this->orgId())
            ->where('statut', 'en_attente')
            ->latest()
            ->get();

        return EmployeResource::collection($employes);
    }

    public function activerCompte(Employe $employe): JsonResponse
    {
        if ($employe->organisation_id !== $this->orgId()) {
            abort(403);
        }

        DB::transaction(function () use ($employe) {
            $employe->update(['statut' => 'actif']);
            if ($employe->user) {
                $employe->user->update(['is_active' => true]);
            }
        });

        return response()->json(['message' => 'Compte employé activé.', 'employe' => new EmployeResource($employe->fresh())]);
    }
}
