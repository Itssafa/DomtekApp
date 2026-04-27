<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Quittance extends Model
{
    use HasFactory;

    protected $table = 'location_quittances';

    protected $fillable = [
        'location_id',
        'periode',
        'date_echeance',
        'montant',
        'montant_paye',
        'date_paiement',
        'statut',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'date_echeance'  => 'date',
            'date_paiement'  => 'date',
            'montant'        => 'decimal:2',
            'montant_paye'   => 'decimal:2',
        ];
    }

    /**
     * Compute statut based on payment data and due date.
     * Call this before saving when montant_paye / date_paiement changes.
     */
    public function computeStatut(): string
    {
        $paye = (float) ($this->montant_paye ?? 0);
        $du   = (float) $this->montant;

        if ($paye <= 0) {
            // Unpaid — check if overdue
            return Carbon::today()->gt($this->date_echeance) ? 'impaye' : 'prevu';
        }

        if ($paye >= $du) {
            // Fully paid — on time or late?
            $datePaie = $this->date_paiement ?? Carbon::today();
            return Carbon::parse($datePaie)->gt($this->date_echeance) ? 'paye_en_retard' : 'paye';
        }

        return 'partiel';
    }

    // --- Relations ---

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
