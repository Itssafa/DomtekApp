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

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
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

    // --- Relations ---

    public function organisation(): HasOne
    {
        return $this->hasOne(Organisation::class);
    }

    public function employe(): HasOne
    {
        return $this->hasOne(Employe::class);
    }

    public function clientProfile(): HasOne
    {
        return $this->hasOne(Client::class);
    }
}
