<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\Contrat;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
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

        $clientIds = $data['client_ids'];
        unset($data['client_ids']);

        $data['organisation_id'] = $orgId;

        $contrat = Contrat::create($data);
        $contrat->clients()->sync($clientIds);

        // Mise à jour statut du bien selon le type de contrat
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
