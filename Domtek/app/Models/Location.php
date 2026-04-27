<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    use HasFactory, HasAuditColumns;

    protected $fillable = [
        'organisation_id',
        'bien_id',
        'locataire_type',
        'locataire_id',
        'locataire_nom',
        'designation',
        'type',
        'utilisation',
        'date_debut',
        'date_fin',
        'premiere_echeance',
        'montant_ht',
        'tva',
        'montant_ttc',
        'frais_syndic',
        'retenue_source',
        'montant_paiement',
        'periodicite',
        'jour_paiement',
        'depot_garantie',
        'renouvellement_auto',
        'assurance',
        'fichier',
        'notes',
        'statut',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date_debut'         => 'date',
            'date_fin'           => 'date',
            'premiere_echeance'  => 'date',
            'montant_ht'         => 'decimal:2',
            'tva'                => 'decimal:2',
            'montant_ttc'        => 'decimal:2',
            'frais_syndic'       => 'decimal:2',
            'retenue_source'     => 'decimal:2',
            'montant_paiement'   => 'decimal:2',
            'depot_garantie'     => 'decimal:2',
            'renouvellement_auto'=> 'boolean',
        ];
    }

    /** TTC = HT * (1 + TVA/100) */
    public static function calculTtc(float $ht, float $tva): float
    {
        return round($ht * (1 + $tva / 100), 2);
    }

    /** Montant paiement = TTC + frais_syndic - retenue_source% du HT */
    public static function calculPaiement(float $ttc, float $frais, float $retenueRate, float $ht): float
    {
        return round($ttc + $frais - ($ht * $retenueRate / 100), 2);
    }

    /** Months between periods for a given periodicite */
    public static function periodiciteMonths(string $periodicite): int
    {
        return match ($periodicite) {
            'trimestriel' => 3,
            'semestriel'  => 6,
            'annuel'      => 12,
            default       => 1, // mensuel
        };
    }

    /** Generate all quittance periods for the full contract duration.
     *  - With date_fin : from premiere_echeance to date_fin (all periods, past & future)
     *  - Open contract : from premiere_echeance to today (grows each month)
     */
    public function genererPeriodes(): array
    {
        $periodes = [];
        $step     = self::periodiciteMonths($this->periodicite);
        $cursor   = $this->premiere_echeance->copy()->startOfMonth();

        // Fixed-term → generate all periods until contract end
        // Open-ended → generate until today (new periods appear each month)
        $limit = $this->date_fin
            ? $this->date_fin->copy()->startOfMonth()
            : Carbon::today()->startOfMonth();

        while ($cursor->lte($limit)) {
            $periodes[] = $cursor->format('Y-m');
            $cursor->addMonths($step);
        }

        return $periodes;
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

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'locataire_id');
    }

    public function prospect(): BelongsTo
    {
        return $this->belongsTo(Prospect::class, 'locataire_id');
    }

    public function quittances(): HasMany
    {
        return $this->hasMany(Quittance::class);
    }

    /** Resolved display name for the locataire */
    public function getLocataireNomDisplayAttribute(): string
    {
        if ($this->locataire_type === 'client' && $this->client) {
            return $this->client->nom_complet;
        }
        if ($this->locataire_type === 'prospect' && $this->prospect) {
            return $this->prospect->nom_complet ?? trim("{$this->prospect->prenom} {$this->prospect->nom}");
        }
        return $this->locataire_nom ?? '—';
    }
}
