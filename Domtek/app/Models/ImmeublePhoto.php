<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImmeublePhoto extends Model
{
    protected $fillable = ['immeuble_id', 'chemin', 'ordre'];

    public function immeuble(): BelongsTo
    {
        return $this->belongsTo(Immeuble::class);
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->chemin);
    }
}
