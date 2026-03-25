<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BienImage extends Model
{
    use HasFactory, HasAuditColumns;

    protected $fillable = [
        'bien_id',
        'chemin',
        'ordre',
        'is_principale',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_principale' => 'boolean',
        ];
    }

    // --- Relations ---

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }
}
