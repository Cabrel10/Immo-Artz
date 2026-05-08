<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'avatar',
        'bio',
        'agency_name',
        'license_number',
        'rating_average',
        'rating_count',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'rating_average' => 'decimal:1',
    ];

    protected $appends = ['full_name'];

    // ==================== ACCESSEURS ====================

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeAgents($query)
    {
        return $query->where('role', 'agent');
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    public function scopeTopRated($query, int $limit = 10)
    {
        return $query->agents()
            ->orderByDesc('rating_average')
            ->orderByDesc('rating_count')
            ->limit($limit);
    }

    // ==================== RELATIONS ====================

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class, 'agent_id');
    }

    public function ratingsReceived(): HasMany
    {
        return $this->hasMany(Rating::class, 'agent_id');
    }

    public function ratingsApproved(): HasMany
    {
        return $this->hasMany(Rating::class, 'approved_by');
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function contactRequests(): HasMany
    {
        return $this->hasMany(ContactRequest::class, 'agent_id');
    }

    // ==================== MÉTHODES ====================

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isAgent(): bool
    {
        return $this->role === 'agent';
    }

    public function isVisitor(): bool
    {
        return $this->role === 'visitor';
    }

    public function updateRatingAverage(): void
    {
        $approvedRatings = $this->ratingsReceived()->approved()->get();
        
        $this->rating_count = $approvedRatings->count();
        $this->rating_average = $approvedRatings->avg('score') ?? 0;
        $this->save();
    }
}
