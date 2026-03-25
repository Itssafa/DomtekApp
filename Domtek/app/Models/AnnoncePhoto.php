<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnnoncePhoto extends Model
{
    protected $fillable = ['annonce_id', 'chemin', 'ordre'];

    public function annonce(): BelongsTo
    {
        return $this->belongsTo(Annonce::class);
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->chemin);
    }
}
