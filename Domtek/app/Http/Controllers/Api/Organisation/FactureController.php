<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\StoreFactureRequest;
use App\Http\Requests\Org\UpdateFactureRequest;
use App\Http\Resources\FactureResource;
use App\Models\Facture;
use App\Services\FactureService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class FactureController extends Controller
{
    public function __construct(private FactureService $service) {}

    private function orgId(): int
    {
        return auth()->user()->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return FactureResource::collection(
            $this->service->index($this->orgId(), $request->only([
                'type', 'statut', 'client_id', 'per_page',
            ]))
        );
    }

    public function store(StoreFactureRequest $request): FactureResource
    {
        return new FactureResource(
            $this->service->store($this->orgId(), $request->validated())
        );
    }

    public function show(Facture $facture): FactureResource
    {
        $this->authorize('view', $facture);
        $facture->load(['client', 'contrat.bien']);

        return new FactureResource($facture);
    }

    public function update(UpdateFactureRequest $request, Facture $facture): FactureResource
    {
        $this->authorize('update', $facture);

        return new FactureResource(
            $this->service->update($facture, $request->validated())
        );
    }

    public function destroy(Facture $facture): JsonResponse
    {
        $this->authorize('delete', $facture);
        $this->service->destroy($facture);

        return response()->json(['message' => 'Facture supprimée.']);
    }

    public function marquerPayee(Facture $facture): JsonResponse
    {
        $this->authorize('update', $facture);

        $facture = $this->service->marquerPayee($facture);

        return response()->json([
            'message' => 'Facture marquée comme payée.',
            'facture' => new FactureResource($facture),
        ]);
    }

    public function telechargerPdf(Facture $facture): Response
    {
        $this->authorize('view', $facture);

        $facture->load(['organisation', 'client', 'contrat.bien']);

        $ref      = $facture->reference ?? 'facture-' . $facture->id;
        $filename = 'facture-' . $ref . '.pdf';

        $pdf = Pdf::loadView('pdf.facture', compact('facture'))
            ->setPaper('a4', 'portrait');

        return $pdf->download($filename);
    }
}
