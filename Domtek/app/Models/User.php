<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasAuditColumns;

    const ROLE_ADMIN        = 'admin';
    const ROLE_ORGANISATION = 'organisation';
    const ROLE_CLIENT       = 'client';
    const ROLE_EMPLOYE      = 'employe';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'google_id',
        'avatar',
        'created_by',
        'updated_by',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    // --- Helpers de rôle ---

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isOrganisation(): bool
    {
        return $this->role === self::ROLE_ORGANISATION;
    }

    public function isClient(): bool
    {
        return $this->role === self::ROLE_CLIENT;
    }

    public function isEmploye(): bool
    {
        return $this->role === self::ROLE_EMPLOYE;
    }

    public function resolveOrgId(): ?int
    {
        if ($this->isEmploye()) {
            return $this->employe?->organisation_id;
        }
        return $this->organisation?->id;
    }

    // --- Relations ---

    public function organisation(): HasOne
    {
        return $this->hasOne(Organisation::class);
    }

    public function employe(): HasOne
    {
        return $this->hasOne(Employe::class);
    }

    /**
     * Fiches clients rattachées à ce compte.
     *
     * L'unicité de l'e-mail est scopée par agence : une même personne peut être
     * cliente de plusieurs organisations, ce qui donne plusieurs fiches pour un
     * seul et même compte de connexion.
     */
    public function clientProfiles(): HasMany
    {
        return $this->hasMany(Client::class);
    }
}
