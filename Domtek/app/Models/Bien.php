<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Bien extends Model
{
    use HasFactory, HasAuditColumns;

    protected $fillable = [
        'organisation_id',
        'immeuble_id',
        'bloc',
        'titre',
        'description',
        'type_transaction',
        'type_bien',
        'prix',
        'superficie',
        'adresse',
        'ville',
        'nb_pieces',
        'nb_chambres',
        'nb_salles_bain',
        'etage',
        'statut',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'prix'      => 'decimal:2',
            'superficie' => 'decimal:2',
        ];
    }

    // --- Relations ---

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function immeuble(): BelongsTo
    {
        return $this->belongsTo(Immeuble::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(BienImage::class);
    }

    public function imagePrincipale(): HasOne
    {
        return $this->hasOne(BienImage::class)->where('is_principale', true);
    }

    public function annonces(): HasMany
    {
        return $this->hasMany(Annonce::class);
    }

    public function contrats(): HasMany
    {
        return $this->hasMany(Contrat::class);
    }
}
