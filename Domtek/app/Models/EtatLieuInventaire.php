<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EtatLieuInventaire extends Model
{
    protected $table = 'etat_lieu_inventaires';

    protected $fillable = [
        'etat_lieu_id',
        'piece',
        'categorie',
        'designation',
        'description',
        'date',
    ];

    protected function casts(): array
    {
        return ['date' => 'date'];
    }

    public function etatLieu(): BelongsTo
    {
        return $this->belongsTo(EtatLieu::class);
    }
}
