<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnonceResource;
use App\Models\Annonce;
use Illuminate\Http\Request;

class AnnonceController extends Controller
{
    /** Liste des annonces publiées avec filtres. */
    public function index(Request $request)
    {
        // Publier automatiquement les annonces planifiées dont la date est atteinte
        Annonce::where('statut', Annonce::STATUT_PLANIFIEE)
            ->where('date_publication', '<=', now())
            ->update(['statut' => Annonce::STATUT_PUBLIEE]);

        $query = Annonce::where('statut', 'publiee')
            ->with([
                'bien.imagePrincipale',
                'organisation:id,nom,slug,ville,logo',
                'photos' => fn($q) => $q->orderBy('ordre')->limit(1),
            ]);

        if ($request->filled('ville')) {
            $query->whereHas('bien', fn($q) => $q->where('ville', $request->ville));
        }
        if ($request->filled('type_transaction')) {
            $query->whereHas('bien', fn($q) => $q->where('type_transaction', $request->type_transaction));
        }
        if ($request->filled('type_bien')) {
            $query->whereHas('bien', fn($q) => $q->where('type_bien', $request->type_bien));
        }
        if ($request->filled('prix_min')) {
            $query->whereHas('bien', fn($q) => $q->where('prix', '>=', $request->prix_min));
        }
        if ($request->filled('prix_max')) {
            $query->whereHas('bien', fn($q) => $q->where('prix', '<=', $request->prix_max));
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('titre', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        return AnnonceResource::collection($query->latest('date_publication')->paginate(12));
    }

    /** Détail d'une annonce publiée. */
    public function show(Annonce $annonce)
    {
        if ($annonce->statut !== 'publiee') {
            abort(404);
        }

        $annonce->load([
            'bien.images',
            'photos',
            'organisation:id,nom,slug,ville,telephone,email,logo,description',
        ]);

        return AnnonceResource::make($annonce);
    }
}
