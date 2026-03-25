<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Immeuble extends Model
{
    use HasFactory, HasAuditColumns;

    protected $fillable = [
        'organisation_id',
        'nom',
        'type_usage',
        'type_propriete',
        'a_blocs',
        'nb_blocs',
        'nb_etages',
        'adresse',
        'ville',
        'pays',
        'sous_sol',
        'cameras_surveillance',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'a_blocs'              => 'boolean',
            'sous_sol'             => 'boolean',
            'cameras_surveillance' => 'boolean',
        ];
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ImmeublePhoto::class)->orderBy('ordre');
    }
}
