<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organisation extends Model
{
    use HasFactory, HasAuditColumns;

    const STATUT_EN_ATTENTE = 'en_attente';
    const STATUT_ACTIVE     = 'active';
    const STATUT_INACTIVE   = 'inactive';

    protected $fillable = [
        'user_id',
        'nom',
        'slug',
        'statut',
        'logo',
        'adresse',
        'ville',
        'telephone',
        'email',
        'description',
        'created_by',
        'updated_by',
    ];

    // --- Route Model Binding ---

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    // --- Helpers ---

    public function isActive(): bool
    {
        return $this->statut === self::STATUT_ACTIVE;
    }

    // --- Relations ---

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function biens(): HasMany
    {
        return $this->hasMany(Bien::class);
    }

    public function annonces(): HasMany
    {
        return $this->hasMany(Annonce::class);
    }

    public function contrats(): HasMany
    {
        return $this->hasMany(Contrat::class);
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }

    public function prospects(): HasMany
    {
        return $this->hasMany(Prospect::class);
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    public function employes(): HasMany
    {
        return $this->hasMany(Employe::class);
    }
}
