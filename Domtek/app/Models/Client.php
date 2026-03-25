<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory, HasAuditColumns;

    protected $fillable = [
        'organisation_id',
        'user_id',
        'civilite',
        'nom',
        'prenom',
        'email',
        'telephone',
        'adresse',
        'ville',
        'cin',
        'type_piece',
        'document_identite',
        'date_naissance',
        'lieu_naissance',
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

    // --- Relations ---

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contrats(): HasMany
    {
        return $this->hasMany(Contrat::class);
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }
}
