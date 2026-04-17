<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tache extends Model
{
    use HasAuditColumns;

    protected $fillable = [
        'organisation_id',
        'titre',
        'description',
        'date_echeance',
        'statut',
        'priorite',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date_echeance'   => 'date',
            'organisation_id' => 'integer',
        ];
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }
}
