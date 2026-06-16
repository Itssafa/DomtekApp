<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProspectSuggestion extends Model
{
    protected $table = 'prospect_suggestions';

    protected $fillable = [
        'organisation_id',
        'prospect_id',
        'bien_id',
        'score',
    ];

    protected function casts(): array
    {
        return ['score' => 'integer'];
    }

    public function prospect(): BelongsTo
    {
        return $this->belongsTo(Prospect::class);
    }

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }
}
