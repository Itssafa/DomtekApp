<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EtatLieu extends Model
{
    use HasFactory, HasAuditColumns;

    protected $table = 'etat_lieux';

    protected $fillable = [
        'organisation_id',
        'contrat_id',
        'designation',
        'type',
        'date',
        'releve_eau',
        'releve_electricite',
        'releve_gaz',
        'remise_cles',
        'commentaire',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date'        => 'date',
            'remise_cles' => 'boolean',
            'releve_eau'          => 'decimal:3',
            'releve_electricite'  => 'decimal:3',
            'releve_gaz'          => 'decimal:3',
        ];
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function contrat(): BelongsTo
    {
        return $this->belongsTo(Contrat::class);
    }
}
