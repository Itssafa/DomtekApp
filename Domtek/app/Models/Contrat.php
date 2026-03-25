<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contrat extends Model
{
    use HasFactory, HasAuditColumns;

    protected $fillable = [
        'organisation_id',
        'bien_id',
        'type',
        'date_debut',
        'date_fin',
        'montant',
        'statut',
        'fichier',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date_debut' => 'date',
            'date_fin'   => 'date',
            'montant'    => 'decimal:2',
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

    public function clients(): BelongsToMany
    {
        return $this->belongsToMany(Client::class, 'client_contrat');
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }
}
