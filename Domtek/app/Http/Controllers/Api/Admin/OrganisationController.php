<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexOrganisationRequest;
use App\Http\Resources\AnnonceResource;
use App\Http\Resources\BienResource;
use App\Http\Resources\OrganisationResource;
use App\Models\Organisation;
use App\Services\OrganisationService;
use Illuminate\Http\JsonResponse;

class OrganisationController extends Controller
{
    public function __construct(private OrganisationService $service) {}

    /** Liste paginée de toutes les organisations avec filtres. */
    public function index(IndexOrganisationRequest $request)
    {
        return OrganisationResource::collection(
            $this->service->index($request->validated())
        );
    }

    /** Détail d'une organisation avec ses statistiques. */
    public function show(Organisation $organisation): JsonResponse
    {
        $organisation->load('user')
            ->loadCount(['biens', 'annonces', 'clients', 'contrats', 'employes']);

        return response()->json(['data' => new OrganisationResource($organisation)]);
    }

    /** Activer un compte organisation. */
    public function activer(Organisation $organisation): JsonResponse
    {
        $organisation = $this->service->activer($organisation);

        return response()->json([
            'message'      => "L'organisation \"{$organisation->nom}\" a été activée.",
            'organisation' => new OrganisationResource($organisation),
        ]);
    }

    /** Désactiver un compte organisation. */
    public function desactiver(Organisation $organisation): JsonResponse
    {
        $organisation = $this->service->desactiver($organisation);

        return response()->json([
            'message'      => "L'organisation \"{$organisation->nom}\" a été désactivée.",
            'organisation' => new OrganisationResource($organisation),
        ]);
    }

    /** Supprimer un compte organisation et son utilisateur. */
    public function destroy(Organisation $organisation): JsonResponse
    {
        $nom = $organisation->nom;
        $this->service->destroy($organisation);

        return response()->json([
            'message' => "L'organisation \"{$nom}\" a été supprimée.",
        ]);
    }

    /** Liste des biens d'une organisation (vue admin). */
    public function biens(Organisation $organisation)
    {
        return BienResource::collection(
            $organisation->biens()->with('images')->latest()->paginate(15)
        );
    }

    /** Liste des annonces d'une organisation (vue admin). */
    public function annonces(Organisation $organisation)
    {
        return AnnonceResource::collection(
            $organisation->annonces()->with('bien')->latest()->paginate(15)
        );
    }

    /** Comptes utilisateurs liés à une organisation (vue admin). */
    public function comptes(Organisation $organisation): JsonResponse
    {
        $organisation->load(['user', 'employes.user']);

        return response()->json([
            'data' => [
                'proprietaire' => $organisation->user,
                'employes'     => $organisation->employes,
            ],
        ]);
    }
}
