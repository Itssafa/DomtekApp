<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\Client;
use App\Models\Contrat;
use App\Models\Prospect;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ContratService
{
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        $query = Contrat::where('organisation_id', $orgId)
            ->with(['bien', 'clients']);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }
        if (!empty($filters['client_id'])) {
            $query->whereHas('clients', fn($q) => $q->where('clients.id', $filters['client_id']));
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);
        return $query->latest()->paginate($perPage);
    }

    public function store(int $orgId, array $data): Contrat
    {
        Bien::where('id', $data['bien_id'])->where('organisation_id', $orgId)->firstOrFail();

        // ── Résolution du client selon les 3 cas ──────────────────────────
        $clientIds = DB::transaction(function () use ($orgId, $data) {

            // Cas 2 — Convertir un prospect existant
            if (!empty($data['prospect_id'])) {
                $prospect = Prospect::where('id', $data['prospect_id'])
                    ->where('organisation_id', $orgId)
                    ->whereNull('client_id')   // pas déjà converti
                    ->firstOrFail();

                $client = Client::create([
                    'organisation_id'   => $orgId,
                    'civilite'          => $prospect->civilite,
                    'nom'               => $prospect->nom,
                    'prenom'            => $prospect->prenom,
                    'email'             => $prospect->email,
                    'telephone'         => $prospect->telephone,
                    'adresse'           => $prospect->adresse,
                    'ville'             => $prospect->ville,
                    'date_naissance'    => $prospect->date_naissance,
                    'lieu_naissance'    => $prospect->lieu_naissance,
                    'type_piece'        => $prospect->type_piece,
                    'cin'               => $prospect->cin,
                    'document_identite' => $prospect->document_identite,
                    'notes'             => $prospect->notes,
                ]);

                // Marquer le prospect comme converti (non supprimé)
                $prospect->update(['client_id' => $client->id]);

                return [$client->id];
            }

            // Cas 3 — Nouveau client (pas dans la base)
            if (!empty($data['nouveau_client'])) {
                $clientData = $data['nouveau_client'];
                $clientData['organisation_id'] = $orgId;
                $client = Client::create($clientData);
                return [$client->id];
            }

            // Cas 1 — Client existant
            return $data['client_ids'] ?? [];
        });

        // Nettoyer les clés spécifiques à la résolution du client
        unset($data['client_ids'], $data['prospect_id'], $data['nouveau_client']);

        $data['organisation_id'] = $orgId;

        $contrat = Contrat::create($data);
        $contrat->clients()->sync($clientIds);

        $nouveauStatut = in_array($data['type'], Contrat::TYPES_LOCATION) ? 'loue' : 'vendu';
        Bien::find($data['bien_id'])->update(['statut' => $nouveauStatut]);

        return $contrat->load(['bien', 'clients']);
    }

    public function update(Contrat $contrat, array $data): Contrat
    {
        $contrat->update($data);

        if (isset($data['statut']) && in_array($data['statut'], ['termine', 'resilie'])) {
            $contrat->bien()->update(['statut' => 'disponible']);
        }

        return $contrat;
    }

    public function uploadFichier(Contrat $contrat, UploadedFile $file, int $orgId): Contrat
    {
        if ($contrat->fichier) {
            Storage::delete($contrat->fichier);
        }

        $chemin = $file->store("contrats/{$orgId}", 'local');
        $contrat->update(['fichier' => $chemin]);

        return $contrat;
    }

    public function destroy(Contrat $contrat): void
    {
        if ($contrat->fichier) {
            Storage::delete($contrat->fichier);
        }

        $contrat->delete();
    }
}
