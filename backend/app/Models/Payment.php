<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'transaction_id',
        'type',
        'payable_type',
        'payable_id',
        'amount',
        'currency',
        'status',
        'payment_method',
        'payment_provider',
        'provider_transaction_id',
        'paid_at',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'metadata' => 'array',
    ];

    // ==================== SCOPES ====================

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // ==================== RELATIONS ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payable()
    {
        return $this->morphTo();
    }

    // ==================== MÉTHODES ====================

    public function markAsCompleted(?string $providerTransactionId = null): void
    {
        $this->update([
            'status' => 'completed',
            'paid_at' => now(),
            'provider_transaction_id' => $providerTransactionId,
        ]);
    }

    public function markAsFailed(?string $reason = null): void
    {
        $this->update([
            'status' => 'failed',
            'metadata' => array_merge($this->metadata ?? [], ['failure_reason' => $reason]),
        ]);
    }

    public function refund(): void
    {
        $this->update(['status' => 'refunded']);
    }

    public static function generateTransactionId(): string
    {
        return 'IMMO-' . strtoupper(uniqid()) . '-' . date('Ymd');
    }
}
