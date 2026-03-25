<?php

namespace App\Services;

use App\Models\Immeuble;
use App\Models\ImmeublePhoto;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class ImmeubleService
{
    public function index(int $orgId, array $filters = []): LengthAwarePaginator
    {
        $query = Immeuble::where('organisation_id', $orgId)
            ->withCount('photos')
            ->with(['photos' => fn($q) => $q->orderBy('ordre')->limit(1)]);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('ville', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 200);
        return $query->latest()->paginate($perPage);
    }

    public function store(int $orgId, array $data, array $photos = []): Immeuble
    {
        $data['organisation_id'] = $orgId;
        if (!$data['a_blocs']) {
            $data['nb_blocs'] = null;
        }

        $immeuble = Immeuble::create($data);
        $this->savePhotos($immeuble, $photos);

        return $immeuble->load('photos');
    }

    public function update(Immeuble $immeuble, array $data): Immeuble
    {
        if (!$data['a_blocs']) {
            $data['nb_blocs'] = null;
        }
        $immeuble->update($data);
        return $immeuble->load('photos');
    }

    public function addPhotos(Immeuble $immeuble, array $files): Immeuble
    {
        $this->savePhotos($immeuble, $files);
        return $immeuble->load('photos');
    }

    public function deletePhoto(ImmeublePhoto $photo): void
    {
        Storage::disk('public')->delete($photo->chemin);
        $photo->delete();
    }

    public function destroy(Immeuble $immeuble): void
    {
        foreach ($immeuble->photos as $photo) {
            Storage::disk('public')->delete($photo->chemin);
        }
        $immeuble->delete();
    }

    private function savePhotos(Immeuble $immeuble, array $files): void
    {
        $ordre = $immeuble->photos()->max('ordre') ?? 0;
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $path = $file->store("immeubles/{$immeuble->id}/photos", 'public');
                ImmeublePhoto::create([
                    'immeuble_id' => $immeuble->id,
                    'chemin'      => $path,
                    'ordre'       => ++$ordre,
                ]);
            }
        }
    }
}
