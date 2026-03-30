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

    /** Types de location (loyers) */
    const TYPES_LOCATION = [
        'bail_habitation', 'bail_etudiant', 'bail_professionnel',
        'bail_commercial', 'bail_saisonnier', 'loyer',
    ];

    protected $fillable = [
        'organisation_id',
        'bien_id',
        'designation',
        'utilisation',
        'type',
        'date_debut',
        'date_fin',
        'montant_ht',
        'tva',
        'montant_ttc',
        'frais_syndic',
        'retenue_source',
        'montant_paiement',
        'periodicite_paiement',
        'jour_paiement',
        'depot_garantie',
        'premiere_echeance',
        'statut',
        'fichier',
        'assurance',
        'notes',
        'forme_juridique',
        'representant',
        'date_contrat',
        'ville_signature',
        'cin_delivree_le',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date_debut'       => 'date',
            'date_fin'         => 'date',
            'date_contrat'     => 'date',
            'cin_delivree_le'  => 'date',
            'premiere_echeance'=> 'date',
            'montant_ht'       => 'decimal:2',
            'tva'              => 'decimal:2',
            'montant_ttc'      => 'decimal:2',
            'frais_syndic'     => 'decimal:2',
            'retenue_source'   => 'decimal:2',
            'montant_paiement' => 'decimal:2',
            'depot_garantie'   => 'decimal:2',
        ];
    }

    public function isLocationContract(): bool
    {
        return in_array($this->type, self::TYPES_LOCATION);
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
