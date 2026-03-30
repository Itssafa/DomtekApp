<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\BienDocument;
use App\Models\BienImage;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class BienService
{
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        $query = Bien::where('organisation_id', $orgId)
            ->with([
                'imagePrincipale',
                'images' => fn($q) => $q->orderBy('ordre')->limit(1),
            ]);

        if (!empty($filters['type_transaction'])) {
            $query->where('type_transaction', $filters['type_transaction']);
        }
        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }
        if (!empty($filters['type_bien'])) {
            $query->where('type_bien', $filters['type_bien']);
        }
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('designation', 'like', "%{$search}%")
                  ->orWhere('ville', 'like', "%{$search}%")
                  ->orWhere('adresse', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);

        return $query->latest()->paginate($perPage);
    }

    public function store(int $orgId, array $data): Bien
    {
        $data['organisation_id'] = $orgId;
        return Bien::create($data);
    }

    public function update(Bien $bien, array $data): Bien
    {
        $bien->update($data);
        return $bien;
    }

    /**
     * @param  UploadedFile[]  $files
     */
    public function uploadImages(Bien $bien, array $files, ?int $imagePrincipaleIndex): array
    {
        $uploaded  = [];
        $ordre     = $bien->images()->max('ordre') ?? 0;
        $hasPrincipale = $bien->images()->where('is_principale', true)->exists();

        foreach ($files as $index => $file) {
            $chemin = $file->store("biens/{$bien->id}", 'public');
            $isPrincipale = ($imagePrincipaleIndex === $index)
                || ($imagePrincipaleIndex === null && !$hasPrincipale && $index === 0);

            if ($isPrincipale) {
                $bien->images()->update(['is_principale' => false]);
                $hasPrincipale = true;
            }

            $uploaded[] = BienImage::create([
                'bien_id'       => $bien->id,
                'chemin'        => $chemin,
                'ordre'         => ++$ordre,
                'is_principale' => $isPrincipale,
            ]);
        }

        return $uploaded;
    }

    public function deleteImage(Bien $bien, BienImage $image): void
    {
        Storage::disk('public')->delete($image->chemin);
        $image->delete();
    }

    public function uploadDocument(Bien $bien, Request $request): BienDocument
    {
        $file   = $request->file('document');
        $nom    = $request->input('nom') ?: $file->getClientOriginalName();
        $chemin = $file->store("biens/{$bien->id}/documents", 'public');

        return BienDocument::create([
            'bien_id'       => $bien->id,
            'nom'           => $nom,
            'chemin'        => $chemin,
            'type_document' => $request->input('type_document'),
        ]);
    }

    public function deleteDocument(Bien $bien, BienDocument $document): void
    {
        Storage::disk('public')->delete($document->chemin);
        $document->delete();
    }

    public function destroy(Bien $bien): void
    {
        foreach ($bien->images as $image) {
            Storage::disk('public')->delete($image->chemin);
        }
        foreach ($bien->documents as $doc) {
            Storage::disk('public')->delete($doc->chemin);
        }

        $bien->delete();
    }
}
