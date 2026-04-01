<?php

namespace App\Services;

use App\Models\Annonce;
use App\Models\AnnoncePhoto;
use App\Models\Bien;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class AnnonceService
{
    /**
     * Liste paginée des annonces d'une organisation avec filtres optionnels.
     */
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        $query = Annonce::where('organisation_id', $orgId)
            ->with([
                'bien.imagePrincipale',
                'photos' => fn($q) => $q->orderBy('ordre')->limit(1),
            ]);

        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }

        if (!empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($term) {
                $q->where('titre', 'like', $term)
                  ->orWhere('description', 'like', $term)
                  ->orWhereHas('bien', fn($b) => $b->where('designation', 'like', $term));
            });
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);
        return $query->latest()->paginate($perPage);
    }

    /**
     * Créer une nouvelle annonce pour une organisation.
     */
    public function store(int $orgId, array $data): Annonce
    {
        Bien::where('id', $data['bien_id'])
            ->where('organisation_id', $orgId)
            ->firstOrFail();

        $data['organisation_id'] = $orgId;

        if (!empty($data['date_publication']) && !isset($data['statut'])) {
            $data['statut'] = Annonce::STATUT_PLANIFIEE;
        }

        // strip file uploads before mass assignment
        unset($data['photos']);

        return Annonce::create($data)->load('bien');
    }

    /**
     * Mettre à jour une annonce existante.
     */
    public function update(Annonce $annonce, array $data): Annonce
    {
        $annonce->update($data);
        return $annonce;
    }

    /**
     * Uploader des photos pour une annonce.
     *
     * @param  UploadedFile[]  $files
     */
    public function uploadPhotos(Annonce $annonce, array $files): array
    {
        $uploaded = [];
        $ordre = $annonce->photos()->max('ordre') ?? 0;

        foreach ($files as $file) {
            $chemin = $file->store("annonces/{$annonce->id}", 'public');
            $uploaded[] = AnnoncePhoto::create([
                'annonce_id' => $annonce->id,
                'chemin'     => $chemin,
                'ordre'      => ++$ordre,
            ]);
        }

        return $uploaded;
    }

    /**
     * Supprimer une photo d'une annonce.
     */
    public function deletePhoto(Annonce $annonce, AnnoncePhoto $photo): void
    {
        Storage::disk('public')->delete($photo->chemin);
        $photo->delete();
    }

    /**
     * Publier immédiatement une annonce.
     */
    public function publier(Annonce $annonce): Annonce
    {
        $annonce->update([
            'statut'           => Annonce::STATUT_PUBLIEE,
            'date_publication' => now(),
        ]);

        return $annonce;
    }

    /**
     * Archiver une annonce publiée.
     */
    public function archiver(Annonce $annonce): Annonce
    {
        $annonce->update(['statut' => Annonce::STATUT_ARCHIVEE]);
        return $annonce;
    }

    /**
     * Supprimer une annonce et toutes ses photos.
     */
    public function destroy(Annonce $annonce): void
    {
        foreach ($annonce->photos as $photo) {
            Storage::disk('public')->delete($photo->chemin);
        }

        $annonce->delete();
    }
}
