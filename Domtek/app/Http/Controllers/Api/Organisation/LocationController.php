<?php

namespace App\Http\Controllers\Api\Organisation;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Http\Resources\QuittanceResource;
use App\Models\Location;
use App\Models\Quittance;
use App\Rules\TelephoneTunisien;
use App\Services\ClientService;
use App\Services\LocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LocationController extends Controller
{
    public function __construct(private LocationService $service, private ClientService $clients) {}

    private function orgId(): int
    {
        $user = auth()->user();
        return $user->isEmploye() ? $user->employe->organisation_id : $user->organisation->id;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return LocationResource::collection(
            $this->service->index($this->orgId(), $request->only([
                'statut', 'type', 'bien_id', 'search', 'per_page',
            ]))
        );
    }

    public function store(Request $request): LocationResource
    {
        $data = $request->validate([
            'bien_id'            => ['required', 'integer'],
            'locataire_type'     => ['required', 'in:client,prospect,nouveau'],
            'locataire_id'       => ['nullable', 'integer'],
            'locataire_nom'      => ['nullable', 'string', 'max:255'],
            'designation'        => ['nullable', 'string', 'max:255'],
            'type'               => ['required', 'in:bail_habitation,bail_etudiant,bail_professionnel,bail_commercial,bail_saisonnier,loyer'],
            'utilisation'        => ['nullable', 'string', 'max:255'],
            'date_debut'         => ['required', 'date'],
            'date_fin'           => ['nullable', 'date', 'after_or_equal:date_debut'],
            'premiere_echeance'  => ['required', 'date'],
            'montant_ht'         => ['required', 'numeric', 'min:0'],
            'tva'                => ['required', 'numeric', 'min:0', 'max:100'],
            'frais_syndic'       => ['nullable', 'numeric', 'min:0'],
            'retenue_source'     => ['nullable', 'numeric', 'min:0', 'max:100'],
            'periodicite'        => ['required', 'in:mensuel,trimestriel,semestriel,annuel'],
            'jour_paiement'      => ['required', 'integer', 'min:1', 'max:28'],
            'depot_garantie'     => ['nullable', 'numeric', 'min:0'],
            'renouvellement_auto'=> ['boolean'],
            'assurance'          => ['nullable', 'string', 'max:255'],
            'notes'              => ['nullable', 'string'],
            'statut'             => ['nullable', 'in:actif,expire,resilie'],
        ]);

        // Nouveau locataire : on crée sa vraie fiche client (et donc son accès
        // à l'espace client) au lieu de ne garder qu'un nom en texte libre.
        $nouveau = null;
        if ($data['locataire_type'] === 'nouveau') {
            $nouveau = $request->validate([
                'nouveau_client'           => ['required', 'array'],
                'nouveau_client.nom'       => ['required', 'string', 'max:100'],
                'nouveau_client.prenom'    => ['required', 'string', 'max:100'],
                'nouveau_client.email'     => [
                    'required', 'email', 'max:255',
                    Rule::unique('clients', 'email')->where('organisation_id', $this->orgId()),
                ],
                'nouveau_client.telephone' => ['nullable', 'string', 'max:20', new TelephoneTunisien],
            ])['nouveau_client'];
        }

        $location = DB::transaction(function () use ($data, $nouveau) {
            if ($nouveau) {
                $client = $this->clients->store($this->orgId(), $nouveau);
                $data['locataire_type'] = 'client';
                $data['locataire_id']   = $client->id;
                $data['locataire_nom']  = null;
            }

            return $this->service->store($this->orgId(), $data);
        });

        return new LocationResource($location);
    }

    public function show(Location $location): LocationResource
    {
        abort_unless($location->organisation_id === $this->orgId(), 403);
        $location->load(['bien', 'quittances' => fn($q) => $q->orderBy('periode')]);

        return new LocationResource($location);
    }

    public function update(Request $request, Location $location): LocationResource
    {
        abort_unless($location->organisation_id === $this->orgId(), 403);

        $data = $request->validate([
            'bien_id'            => ['sometimes', 'integer'],
            'locataire_type'     => ['sometimes', 'in:client,prospect,nouveau'],
            'locataire_id'       => ['nullable', 'integer'],
            'locataire_nom'      => ['nullable', 'string', 'max:255'],
            'designation'        => ['nullable', 'string', 'max:255'],
            'type'               => ['sometimes', 'in:bail_habitation,bail_etudiant,bail_professionnel,bail_commercial,bail_saisonnier,loyer'],
            'utilisation'        => ['nullable', 'string', 'max:255'],
            'date_debut'         => ['sometimes', 'date'],
            'date_fin'           => ['nullable', 'date'],
            'premiere_echeance'  => ['sometimes', 'date'],
            'montant_ht'         => ['sometimes', 'numeric', 'min:0'],
            'tva'                => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'frais_syndic'       => ['nullable', 'numeric', 'min:0'],
            'retenue_source'     => ['nullable', 'numeric', 'min:0', 'max:100'],
            'periodicite'        => ['sometimes', 'in:mensuel,trimestriel,semestriel,annuel'],
            'jour_paiement'      => ['sometimes', 'integer', 'min:1', 'max:28'],
            'depot_garantie'     => ['nullable', 'numeric', 'min:0'],
            'renouvellement_auto'=> ['boolean'],
            'assurance'          => ['nullable', 'string', 'max:255'],
            'notes'              => ['nullable', 'string'],
            'statut'             => ['nullable', 'in:actif,expire,resilie'],
        ]);

        return new LocationResource(
            $this->service->update($location, $data)
        );
    }

    public function destroy(Location $location): JsonResponse
    {
        abort_unless($location->organisation_id === $this->orgId(), 403);
        $this->service->destroy($location);

        return response()->json(['message' => 'Location supprimée.']);
    }

    /** POST /org/locations/{location}/assurance */
    public function uploadAssurance(Request $request, Location $location): LocationResource
    {
        abort_unless($location->organisation_id === $this->orgId(), 403);

        $request->validate([
            'assurance' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ]);

        return new LocationResource(
            $this->service->uploadAssurance($location, $request->file('assurance'), $this->orgId())
        );
    }

    /** PATCH /org/locations/{location}/quittances/{quittance}/payer */
    public function payerQuittance(Request $request, Location $location, Quittance $quittance): QuittanceResource
    {
        abort_unless($location->organisation_id === $this->orgId(), 403);
        abort_unless($quittance->location_id === $location->id, 404);

        $data = $request->validate([
            'montant_paye'  => ['required', 'numeric', 'min:0'],
            'date_paiement' => ['nullable', 'date'],
            'notes'         => ['nullable', 'string'],
        ]);

        if (!empty($data['notes'])) {
            $quittance->notes = $data['notes'];
        }

        return new QuittanceResource(
            $this->service->enregistrerPaiement($quittance, $data['montant_paye'], $data['date_paiement'] ?? null)
        );
    }
}
