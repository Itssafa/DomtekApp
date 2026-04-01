<?php

namespace App\Services;

use App\Models\Prospect;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class ProspectService
{
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        $query = Prospect::where('organisation_id', $orgId);

        // Par défaut on n'affiche que les prospects non convertis
        // Passer include_convertis=1 pour les voir aussi
        if (empty($filters['include_convertis'])) {
            $query->actif();
        }

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

    public function store(int $orgId, array $data): Prospect
    {
        $file = $data['document_identite'] ?? null;
        unset($data['document_identite']);

        $data['organisation_id'] = $orgId;
        $prospect = Prospect::create($data);

        if ($file instanceof UploadedFile) {
            $path = $file->store("prospects/{$prospect->id}/documents", 'public');
            $prospect->update(['document_identite' => $path]);
        }

        return $prospect;
    }

    public function uploadDocument(Prospect $prospect, UploadedFile $file): Prospect
    {
        if ($prospect->document_identite) {
            Storage::disk('public')->delete($prospect->document_identite);
        }

        $path = $file->store("prospects/{$prospect->id}/documents", 'public');
        $prospect->update(['document_identite' => $path]);

        return $prospect;
    }

    public function update(Prospect $prospect, array $data): Prospect
    {
        $prospect->update($data);
        return $prospect;
    }

    public function destroy(Prospect $prospect): void
    {
        $prospect->delete();
    }
}
