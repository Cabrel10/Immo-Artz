<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class CatalogPassword extends Model
{
    use HasFactory;

    protected $fillable = [
        'password',
        'hash',
        'price',
        'currency',
        'valid_from',
        'valid_until',
        'is_active',
        'max_uses',
        'current_uses',
        'last_used_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    // ==================== CONSTANTES ====================

    const DEFAULT_PRICE = 2000; // FCFA
    const DEFAULT_VALIDITY_HOURS = 12;
    const DEFAULT_MAX_USES = 100;

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('valid_from', '<=', now())
            ->where('valid_until', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('valid_until', '<', now());
    }

    public function scopeExhausted($query)
    {
        return $query->whereColumn('current_uses', '>=', 'max_uses');
    }

    // ==================== RELATIONS ====================

    public function accessLogs(): HasMany
    {
        return $this->hasMany(CatalogAccessLog::class);
    }

    // ==================== ACCESSEURS ====================

    public function getIsValidAttribute(): bool
    {
        return $this->is_active 
            && $this->valid_from <= now() 
            && $this->valid_until > now()
            && $this->current_uses < $this->max_uses;
    }

    public function getTimeRemainingAttribute(): ?string
    {
        if (!$this->is_valid) {
            return null;
        }
        
        $diff = $this->valid_until->diff(now());
        
        if ($diff->h > 0) {
            return $diff->h . 'h ' . $diff->i . 'min';
        }
        return $diff->i . 'min';
    }

    public function getUsesRemainingAttribute(): int
    {
        return max(0, $this->max_uses - $this->current_uses);
    }

    // ==================== MÉTHODES ====================

    public function verify(string $password): bool
    {
        return Hash::check($password, $this->hash);
    }

    public function recordAccess(string $ip, ?string $userAgent = null, bool $success = true, ?string $failureReason = null): void
    {
        $this->accessLogs()->create([
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'accessed_at' => now(),
            'success' => $success,
            'failure_reason' => $failureReason,
        ]);

        if ($success) {
            $this->increment('current_uses');
            $this->update(['last_used_at' => now()]);
        }
    }

    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }

    public static function generatePassword(int $length = 8): string
    {
        // Génère un mot de passe alphanumérique facile à taper
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclut I, O, 0, 1 pour éviter confusion
        $password = '';
        
        for ($i = 0; $i < $length; $i++) {
            $password .= $characters[random_int(0, strlen($characters) - 1)];
        }
        
        return $password;
    }

    public static function createNew(?float $price = null, ?int $validityHours = null, ?int $maxUses = null): self
    {
        $password = self::generatePassword();
        
        return self::create([
            'password' => $password,
            'hash' => Hash::make($password),
            'price' => $price ?? self::DEFAULT_PRICE,
            'currency' => 'XAF',
            'valid_from' => now(),
            'valid_until' => now()->addHours($validityHours ?? self::DEFAULT_VALIDITY_HOURS),
            'is_active' => true,
            'max_uses' => $maxUses ?? self::DEFAULT_MAX_USES,
            'current_uses' => 0,
        ]);
    }

    public static function getCurrentValid(): ?self
    {
        return self::active()->latest()->first();
    }

    public static function rotate(): self
    {
        // Désactive tous les mots de passe actifs
        self::where('is_active', true)->update(['is_active' => false]);
        
        // Crée un nouveau mot de passe
        return self::createNew();
    }

    public static function cleanupExpired(): int
    {
        return self::expired()
            ->where('is_active', true)
            ->update(['is_active' => false]);
    }
}
