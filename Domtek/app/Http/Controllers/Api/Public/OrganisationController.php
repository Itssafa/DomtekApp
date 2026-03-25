<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnonceResource;
use App\Http\Resources\OrganisationResource;
use App\Models\Organisation;
use Illuminate\Http\Request;

class OrganisationController extends Controller
{
    /** Liste des agences actives. */
    public function index(Request $request)
    {
        $query = Organisation::where('statut', 'active')
            ->withCount(['annonces' => fn($q) => $q->where('statut', 'publiee')]);

        if ($request->filled('ville')) {
            $query->where('ville', $request->ville);
        }
        if ($request->filled('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%');
        }

        return OrganisationResource::collection($query->latest()->paginate(12));
    }

    /** Profil public d'une agence avec ses annonces publiées. */
    public function show(string $slug)
    {
        $organisation = Organisation::where('slug', $slug)
            ->where('statut', 'active')
            ->firstOrFail();

        $paginator = $organisation->annonces()
            ->where('statut', 'publiee')
            ->with('bien.imagePrincipale')
            ->latest('date_publication')
            ->paginate(12);

        $annonceData = $paginator->getCollection()
            ->map(fn($a) => (new AnnonceResource($a))->resolve())
            ->values();

        return response()->json([
            'data'     => new OrganisationResource($organisation),
            'annonces' => [
                'data' => $annonceData,
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page'    => $paginator->lastPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                    'from'         => $paginator->firstItem(),
                    'to'           => $paginator->lastItem(),
                ],
            ],
        ]);
    }
}
