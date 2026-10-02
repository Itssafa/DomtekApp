<?php

namespace App\Services;

use App\Models\Client;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class ClientService
{
    /**
     * Liste paginée des clients d'une organisation avec recherche optionnelle.
     */
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        // `user` est chargé pour l'état d'accès exposé par ClientResource.
        $query = Client::with('user')->where('organisation_id', $orgId);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);
        return $query->latest()->paginate($perPage);
    }

    /**
     * Créer un nouveau client pour une organisation.
     */
    public function store(int $orgId, array $data): Client
    {
        $file = $data['document_identite'] ?? null;
        unset($data['document_identite']);

        $data['organisation_id'] = $orgId;
        $client = Client::create($data);

        if ($file instanceof UploadedFile) {
            $path = $file->store("clients/{$client->id}/documents", 'public');
            $client->update(['document_identite' => $path]);
        }

        return $client;
    }

    /**
     * Uploader / remplacer le document d'identité d'un client.
     */
    public function uploadDocument(Client $client, UploadedFile $file): Client
    {
        if ($client->document_identite) {
            Storage::disk('public')->delete($client->document_identite);
        }

        $path = $file->store("clients/{$client->id}/documents", 'public');
        $client->update(['document_identite' => $path]);

        return $client;
    }

    /**
     * Mettre à jour un client existant.
     */
    public function update(Client $client, array $data): Client
    {
        $client->update($data);
        return $client;
    }

    /**
     * Supprimer un client.
     */
    public function destroy(Client $client): void
    {
        $client->delete();
    }
}
