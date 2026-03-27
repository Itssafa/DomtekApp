<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Facture extends Model
{
    use HasFactory, HasAuditColumns;

    const TYPE_EAU              = 'eau';
    const TYPE_ELECTRICITE      = 'electricite';
    const TYPE_GAZ              = 'gaz';
    const TYPE_ELECTRICITE_GAZ  = 'electricite_gaz';
    const TYPE_LOYER            = 'loyer';

    const STATUT_EN_ATTENTE = 'en_attente';
    const STATUT_PAYEE      = 'payee';
    const STATUT_EN_RETARD  = 'en_retard';

    protected $fillable = [
        'organisation_id',
        'client_id',
        'contrat_id',
        'type',
        'montant',
        'date_emission',
        'date_echeance',
        'statut',
        'reference',
        'notes',
        'payment_token',
        'stripe_session_id',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date_emission' => 'date',
            'date_echeance' => 'date',
            'montant'       => 'decimal:2',
        ];
    }

    // --- Relations ---

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function contrat(): BelongsTo
    {
        return $this->belongsTo(Contrat::class);
    }
}
