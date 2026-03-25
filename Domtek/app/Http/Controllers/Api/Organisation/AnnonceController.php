<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreAnnonceRequest;
use App\Http\Requests\Org\UpdateAnnonceRequest;
use App\Http\Resources\AnnonceResource;
use App\Http\Resources\AnnoncePhotoResource;
use App\Models\Annonce;
use App\Models\AnnoncePhoto;
use App\Services\AnnonceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AnnonceController extends Controller
{
    public function __construct(private AnnonceService $service) {}

    private function orgId(): int
    {
        return auth()->user()->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $annonces = $this->service->index($this->orgId(), $request->only(['statut', 'per_page']));

        return AnnonceResource::collection($annonces);
    }

    public function store(StoreAnnonceRequest $request): AnnonceResource
    {
        $annonce = $this->service->store($this->orgId(), $request->validated());

        if ($request->hasFile('photos')) {
            $this->service->uploadPhotos($annonce, $request->file('photos'));
            $annonce->load('photos');
        }

        return new AnnonceResource($annonce);
    }

    public function show(Annonce $annonce): AnnonceResource
    {
        $this->authorize('view', $annonce);

        $annonce->load(['bien.images', 'bien.organisation', 'photos']);

        return new AnnonceResource($annonce);
    }

    public function update(UpdateAnnonceRequest $request, Annonce $annonce): AnnonceResource
    {
        $this->authorize('update', $annonce);

        $annonce = $this->service->update($annonce, $request->validated());

        return new AnnonceResource($annonce);
    }

    public function destroy(Annonce $annonce): JsonResponse
    {
        $this->authorize('delete', $annonce);

        $this->service->destroy($annonce);

        return response()->json(['message' => 'Annonce supprimée.']);
    }

    public function publier(Annonce $annonce): JsonResponse
    {
        $this->authorize('update', $annonce);

        $annonce = $this->service->publier($annonce);

        return response()->json(['message' => 'Annonce publiée.', 'annonce' => new AnnonceResource($annonce)]);
    }

    public function archiver(Annonce $annonce): JsonResponse
    {
        $this->authorize('update', $annonce);

        $annonce = $this->service->archiver($annonce);

        return response()->json(['message' => 'Annonce archivée.', 'annonce' => new AnnonceResource($annonce)]);
    }

    public function uploadPhotos(Request $request, Annonce $annonce): JsonResponse
    {
        $this->authorize('update', $annonce);

        $request->validate([
            'photos'   => 'required|array|min:1',
            'photos.*' => 'image|max:5120',
        ]);

        $photos = $this->service->uploadPhotos($annonce, $request->file('photos'));

        return response()->json([
            'message' => count($photos) . ' photo(s) ajoutée(s).',
            'photos'  => AnnoncePhotoResource::collection(collect($photos)),
        ]);
    }

    public function deletePhoto(Annonce $annonce, AnnoncePhoto $photo): JsonResponse
    {
        $this->authorize('update', $annonce);

        abort_if($photo->annonce_id !== $annonce->id, 404);

        $this->service->deletePhoto($annonce, $photo);

        return response()->json(['message' => 'Photo supprimée.']);
    }
}
