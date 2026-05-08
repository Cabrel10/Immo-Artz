<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id',
        'property_id',
        'rater_name',
        'rater_email',
        'rater_phone',
        'rater_ip',
        'score',
        'comment',
        'status',
        'approved_at',
        'approved_by',
    ];

    protected $casts = [
        'score' => 'integer',
        'approved_at' => 'datetime',
    ];

    // ==================== SCOPES ====================

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeForAgent($query, int $agentId)
    {
        return $query->where('agent_id', $agentId);
    }

    public function scopeFromIp($query, string $ip)
    {
        return $query->where('rater_ip', $ip);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // ==================== RELATIONS ====================

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ==================== MÉTHODES ====================

    public function approve(int $adminId): void
    {
        $this->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $adminId,
        ]);
        
        // Mettre à jour la moyenne de l'agent
        $this->agent->updateRatingAverage();
    }

    public function reject(int $adminId): void
    {
        $this->update([
            'status' => 'rejected',
            'approved_at' => now(),
            'approved_by' => $adminId,
        ]);
    }

    public static function hasRatedRecently(int $agentId, string $ip, int $hours = 24): bool
    {
        return self::forAgent($agentId)
            ->fromIp($ip)
            ->where('created_at', '>=', now()->subHours($hours))
            ->exists();
    }

    public static function getStarsAttribute(int $score): string
    {
        return str_repeat('★', $score) . str_repeat('☆', 5 - $score);
    }
}
