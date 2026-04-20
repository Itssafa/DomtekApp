<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreBienRequest;
use App\Http\Requests\Org\UpdateBienRequest;
use App\Http\Requests\Org\UploadBienImagesRequest;
use App\Http\Resources\BienDocumentResource;
use App\Http\Resources\BienResource;
use App\Models\Bien;
use App\Models\BienDocument;
use App\Models\BienImage;
use App\Services\BienService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BienController extends Controller
{
    public function __construct(private BienService $service) {}

    private function orgId(): int
    {
        $user = auth()->user();
        return $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return BienResource::collection(
            $this->service->index($this->orgId(), $request->only([
                'type_transaction', 'statut', 'type_bien', 'search', 'per_page',
            ]))
        );
    }

    public function store(StoreBienRequest $request): BienResource
    {
        return new BienResource(
            $this->service->store($this->orgId(), $request->validated())
        );
    }

    public function show(Bien $bien): BienResource
    {
        $this->authorize('view', $bien);
        $bien->load(['images', 'documents', 'annonces', 'contrats.clients']);

        return new BienResource($bien);
    }

    public function update(UpdateBienRequest $request, Bien $bien): BienResource
    {
        $this->authorize('update', $bien);

        return new BienResource(
            $this->service->update($bien, $request->validated())
        );
    }

    public function destroy(Bien $bien): JsonResponse
    {
        $this->authorize('delete', $bien);
        $this->service->destroy($bien);

        return response()->json(['message' => 'Bien supprimé avec succès.']);
    }

    // ── Images ────────────────────────────────────────────────────────────────

    public function uploadImages(UploadBienImagesRequest $request, Bien $bien): JsonResponse
    {
        $this->authorize('update', $bien);

        $uploaded = $this->service->uploadImages(
            $bien,
            $request->file('images'),
            $request->input('image_principale')
        );

        return response()->json([
            'message' => count($uploaded) . ' image(s) uploadée(s).',
            'images'  => $uploaded,
        ], 201);
    }

    public function deleteImage(Bien $bien, BienImage $image): JsonResponse
    {
        $this->authorize('update', $bien);
        $this->service->deleteImage($bien, $image);

        return response()->json(['message' => 'Image supprimée.']);
    }

    // ── Documents ─────────────────────────────────────────────────────────────

    public function uploadDocument(Request $request, Bien $bien): JsonResponse
    {
        $this->authorize('update', $bien);

        $request->validate([
            'document'      => ['required', 'file', 'max:10240'], // 10 Mo
            'nom'           => ['nullable', 'string', 'max:255'],
            'type_document' => ['nullable', 'string', 'max:50'],
        ]);

        $doc = $this->service->uploadDocument($bien, $request);

        return response()->json([
            'message'  => 'Document uploadé.',
            'document' => new BienDocumentResource($doc),
        ], 201);
    }

    public function deleteDocument(Bien $bien, BienDocument $document): JsonResponse
    {
        $this->authorize('update', $bien);
        $this->service->deleteDocument($bien, $document);

        return response()->json(['message' => 'Document supprimé.']);
    }
}
