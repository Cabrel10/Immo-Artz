<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class CatalogAccessLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'catalog_password_id',
        'ip_address',
        'user_agent',
        'country',
        'city',
        'accessed_at',
        'success',
        'failure_reason',
    ];

    protected $casts = [
        'accessed_at' => 'datetime',
        'success' => 'boolean',
    ];

    // ==================== SCOPES ====================

    public function scopeSuccessful($query)
    {
        return $query->where('success', true);
    }

    public function scopeFailed($query)
    {
        return $query->where('success', false);
    }

    public function scopeFromIp($query, string $ip)
    {
        return $query->where('ip_address', $ip);
    }

    public function scopeRecent($query, int $minutes = 60)
    {
        return $query->where('accessed_at', '>=', now()->subMinutes($minutes));
    }

    public function scopeForPassword($query, int $passwordId)
    {
        return $query->where('catalog_password_id', $passwordId);
    }

    // ==================== RELATIONS ====================

    public function catalogPassword(): BelongsTo
    {
        return $this->belongsTo(CatalogPassword::class);
    }

    // ==================== MÉTHODES ====================

    public static function getRecentAttemptsFromIp(string $ip, int $minutes = 60): int
    {
        return self::fromIp($ip)
            ->recent($minutes)
            ->count();
    }

    public static function getRecentFailedAttemptsFromIp(string $ip, int $minutes = 60): int
    {
        return self::fromIp($ip)
            ->failed()
            ->recent($minutes)
            ->count();
    }

    public static function isRateLimited(string $ip, int $maxAttempts = 5, int $windowMinutes = 60): bool
    {
        return self::getRecentFailedAttemptsFromIp($ip, $windowMinutes) >= $maxAttempts;
    }
}
