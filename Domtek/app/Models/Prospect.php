<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prospect extends Model
{
    use HasFactory, HasAuditColumns;

    protected $table = 'prospects';

    const REVENUS_SCORES = [
        'moins_1000'  => 0,
        '1000_2000'   => 5,
        '3000_6000'   => 10,
        '7000_10000'  => 15,
        'plus_10000'  => 20,
    ];

    const SOLVABILITE_SCORES = [
        'verifie'             => 40,
        'plutot_verifie'      => 25,
        'plutot_non_verifie'  => 10,
        'non_verifie'         => 0,
    ];

    const IMPRESSION_SCORES = [
        'satisfait'     => 20,
        'neutre'        => 10,
        'non_satisfait' => 0,
    ];

    protected $fillable = [
        'organisation_id',
        'client_id',
        'user_id',
        'civilite',
        'nom',
        'prenom',
        'email',
        'telephone',
        'adresse',
        'ville',
        'cin',
        'type_piece',
        'document_identite',
        'date_naissance',
        'lieu_naissance',
        'notes',
        // Profil prospect
        'profession',
        'revenus_mensuels',
        'composition_foyer',
        'biens_interet',
        'score_solvabilite',
        'impression_premiere_visite',
        'hierarchie_besoins',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date_naissance'     => 'date',
            'composition_foyer'  => 'array',
            'biens_interet'      => 'array',
            'hierarchie_besoins' => 'array',
        ];
    }

    /** Score d'opportunité /100 */
    public function scoreOpportunite(): int
    {
        $score = 0;
        $score += self::REVENUS_SCORES[$this->revenus_mensuels] ?? 0;        // 0–20
        $score += self::SOLVABILITE_SCORES[$this->score_solvabilite] ?? 0;   // 0–40
        if (!empty($this->biens_interet)) $score += 10;                       // 0–10

        $derniereVisite = $this->visites()
            ->where('statut', 'effectuee')
            ->latest('date_visite')
            ->first();

        if ($derniereVisite) {
            $score += 10;                                                      // visite effectuée: 10
            $score += self::IMPRESSION_SCORES[$derniereVisite->impression_client] ?? 0; // 0–20
        } elseif ($this->impression_premiere_visite) {
            $score += 10;                                                      // visite effectuée: 10
            $score += self::IMPRESSION_SCORES[$this->impression_premiere_visite] ?? 0; // 0–20
        }

        return min(100, $score);
    }

    // --- Scopes ---

    /** Prospects actifs (non encore convertis en client) */
    public function scopeActif(Builder $query): Builder
    {
        return $query->whereNull('client_id');
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

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function visites(): HasMany
    {
        return $this->hasMany(Visite::class, 'prospect_id');
    }
}
