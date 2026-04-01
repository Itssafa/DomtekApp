<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory, HasAuditColumns;

    protected $fillable = [
        'organisation_id',
        'civilite',
        'nom',
        'prenom',
        'email',
        'telephone',
        'adresse',
        'ville',
        'date_naissance',
        'lieu_naissance',
        'type_piece',
        'cin',
        'document_identite',
        'urgence_nom',
        'urgence_telephone',
        'urgence_relation',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date_naissance' => 'date',
        ];
    }

    public function getNomCompletAttribute(): string
    {
        return trim(($this->civilite ? $this->civilite . ' ' : '') . $this->prenom . ' ' . $this->nom);
    }

    // --- Relations ---

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function contrats(): BelongsToMany
    {
        return $this->belongsToMany(Contrat::class, 'client_contrat');
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class, 'client_id');
    }
}
