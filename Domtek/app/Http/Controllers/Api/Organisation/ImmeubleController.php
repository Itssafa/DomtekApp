<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreImmeubleRequest;
use App\Http\Requests\Org\UpdateImmeubleRequest;
use App\Http\Resources\ImmeubleResource;
use App\Models\Immeuble;
use App\Models\ImmeublePhoto;
use App\Services\ImmeubleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ImmeubleController extends Controller
{
    public function __construct(private ImmeubleService $service) {}

    private function orgId(): int
    {
        return auth()->user()->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return ImmeubleResource::collection(
            $this->service->index($this->orgId(), $request->only(['search', 'per_page']))
        );
    }

    public function store(StoreImmeubleRequest $request): ImmeubleResource
    {
        $validated = $request->validated();
        $photos    = $request->file('photos', []);
        $data      = array_filter($validated, fn($k) => $k !== 'photos', ARRAY_FILTER_USE_KEY);

        return new ImmeubleResource(
            $this->service->store($this->orgId(), $data, $photos)
        );
    }

    public function show(Immeuble $immeuble): ImmeubleResource
    {
        $this->authorize('view', $immeuble);
        $immeuble->load('photos');
        return new ImmeubleResource($immeuble);
    }

    public function update(UpdateImmeubleRequest $request, Immeuble $immeuble): ImmeubleResource
    {
        $this->authorize('update', $immeuble);
        return new ImmeubleResource(
            $this->service->update($immeuble, $request->validated())
        );
    }

    public function uploadPhotos(Request $request, Immeuble $immeuble): ImmeubleResource
    {
        $this->authorize('update', $immeuble);
        $request->validate([
            'photos'   => ['required', 'array'],
            'photos.*' => ['file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        return new ImmeubleResource(
            $this->service->addPhotos($immeuble, $request->file('photos'))
        );
    }

    public function deletePhoto(Immeuble $immeuble, ImmeublePhoto $photo): JsonResponse
    {
        $this->authorize('update', $immeuble);
        $this->service->deletePhoto($photo);
        return response()->json(['message' => 'Photo supprimée.']);
    }

    public function destroy(Immeuble $immeuble): JsonResponse
    {
        $this->authorize('delete', $immeuble);
        $this->service->destroy($immeuble);
        return response()->json(['message' => 'Immeuble supprimé.']);
    }
}
