<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employe extends Model
{
    use HasFactory, HasAuditColumns;

    protected $fillable = [
        'organisation_id',
        'user_id',
        'nom',
        'prenom',
        'email',
        'telephone',
        'poste',
        'date_embauche',
        'statut',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date_embauche' => 'date',
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
}
