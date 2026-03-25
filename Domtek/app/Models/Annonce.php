<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Annonce extends Model
{
    use HasFactory, HasAuditColumns;

    const STATUT_BROUILLON  = 'brouillon';
    const STATUT_PLANIFIEE  = 'planifiee';
    const STATUT_PUBLIEE    = 'publiee';
    const STATUT_ARCHIVEE   = 'archivee';

    protected $fillable = [
        'organisation_id',
        'bien_id',
        'titre',
        'description',
        'date_publication',
        'statut',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date_publication' => 'datetime',
        ];
    }

    // --- Relations ---

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(AnnoncePhoto::class)->orderBy('ordre');
    }
}
