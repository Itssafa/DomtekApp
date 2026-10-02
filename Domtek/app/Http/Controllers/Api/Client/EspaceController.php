<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Espace\ContratResource;
use App\Http\Resources\Espace\FactureResource;
use App\Http\Resources\Espace\QuittanceResource;
use App\Services\EspaceClientService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

/**
 * Espace client — lecture seule.
 *
 * Le client ne modifie rien ici : il consulte ses contrats et ses factures, et
 * règle ces dernières via le lien de paiement. Toute écriture reste du ressort
 * de son agence.
 */
class EspaceController extends Controller
{
    public function __construct(private EspaceClientService $service) {}

    /**
     * Accueil : chiffres de tête + agences dont le client dépend.
     */
    public function resume(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'resume'  => $this->service->resume($user),
            'agences' => $this->service->profils($user)->map(fn ($fiche) => [
                'client_id'   => $fiche->id,
                'nom_complet' => $fiche->nom_complet,
                'agence'      => $fiche->organisation ? [
                    'nom'       => $fiche->organisation->nom,
                    'slug'      => $fiche->organisation->slug,
                    'telephone' => $fiche->organisation->telephone,
                    'email'     => $fiche->organisation->email,
                ] : null,
            ]),
        ]);
    }

    public function contrats(Request $request): AnonymousResourceCollection
    {
        return ContratResource::collection(
            $this->service->contrats($request->user(), $request->only(['statut', 'per_page']))
        );
    }

    public function contrat(Request $request, int $id): ContratResource
    {
        return new ContratResource($this->service->contrat($request->user(), $id));
    }

    /**
     * Télécharger son contrat en PDF.
     *
     * Même vue Blade que côté agence : c'est le même document, il n'y a pas
     * lieu d'en maintenir deux. Le périmètre est assuré par contrat(), qui
     * renvoie 404 sur un contrat qui n'est pas celui du client.
     */
    public function contratPdf(Request $request, int $id): Response
    {
        $contrat = $this->service->contrat($request->user(), $id);
        $contrat->load('clients');

        return Pdf::loadView('pdf.contrat', compact('contrat'))
            ->setPaper('a4', 'portrait')
            ->download('contrat-' . $contrat->id . '.pdf');
    }

    public function quittances(Request $request): AnonymousResourceCollection
    {
        return QuittanceResource::collection(
            $this->service->quittances($request->user(), $request->only(['statut', 'per_page']))
        );
    }

    public function factures(Request $request): AnonymousResourceCollection
    {
        return FactureResource::collection(
            $this->service->factures($request->user(), $request->only(['statut', 'type', 'per_page']))
        );
    }

    public function facture(Request $request, int $id): FactureResource
    {
        return new FactureResource($this->service->facture($request->user(), $id));
    }
}
