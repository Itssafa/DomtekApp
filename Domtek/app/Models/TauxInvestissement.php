<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TauxInvestissement extends Model
{
    use HasFactory, HasAuditColumns;

    protected $table = 'taux_investissement';

    protected $fillable = [
        'organisation_id',
        'taux',
        'periode',
        'description',
        'date_debut',
        'date_fin',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'taux'       => 'decimal:2',
            'date_debut' => 'date',
            'date_fin'   => 'date',
        ];
    }

    // --- Relations ---

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }
}
