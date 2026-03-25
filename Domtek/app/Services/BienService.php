<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\BienImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class BienService
{
    /**
     * Liste paginée des biens d'une organisation avec filtres optionnels.
     */
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
                $q->where('titre', 'like', "%{$search}%")
                  ->orWhere('ville', 'like', "%{$search}%")
                  ->orWhere('adresse', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);

        return $query->latest()->paginate($perPage);
    }

    /**
     * Créer un nouveau bien pour une organisation.
     */
    public function store(int $orgId, array $data): Bien
    {
        $data['organisation_id'] = $orgId;
        return Bien::create($data);
    }

    /**
     * Mettre à jour un bien existant.
     */
    public function update(Bien $bien, array $data): Bien
    {
        $bien->update($data);
        return $bien;
    }

    /**
     * Uploader des images pour un bien.
     *
     * @param  UploadedFile[]  $files
     */
    public function uploadImages(Bien $bien, array $files, ?int $imagePrincipaleIndex): array
    {
        $uploaded = [];
        $ordre = $bien->images()->max('ordre') ?? 0;

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

    /**
     * Supprimer une image d'un bien.
     */
    public function deleteImage(Bien $bien, BienImage $image): void
    {
        Storage::disk('public')->delete($image->chemin);
        $image->delete();
    }

    /**
     * Supprimer un bien et toutes ses images.
     */
    public function destroy(Bien $bien): void
    {
        foreach ($bien->images as $image) {
            Storage::disk('public')->delete($image->chemin);
        }

        $bien->delete();
    }
}
