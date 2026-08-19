<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'agent_id',
        'title',
        'description',
        'type',
        'standing',
        'transaction_type',
        'price',
        'currency',
        'area',
        'bedrooms',
        'bathrooms',
        'parking_spaces',
        'floor',
        'total_floors',
        'construction_year',
        'is_furnished',
        'features',
        'images',
        'main_image',
        'video_url',
        'virtual_tour_url',
        'address',
        'city',
        'quartier',
        'postal_code',
        'latitude',
        'longitude',
        'status',
        'is_featured',
        'is_premium',
        'published_at',
        'expires_at',
        'view_count',
        'contact_count',
    ];

    protected $casts = [
        'features' => 'array',
        'images' => 'array',
        'price' => 'decimal:2',
        'area' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'is_featured' => 'boolean',
        'is_premium' => 'boolean',
        'is_furnished' => 'boolean',
        'published_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    // ==================== CONSTANTES ====================

    const TYPES = [
        'apartment' => 'Appartement',
        'house' => 'Maison',
        'villa' => 'Villa',
        'land' => 'Terrain',
        'commercial' => 'Commercial',
        'office' => 'Bureau',
        'car' => 'Voiture',
        'suv' => 'SUV/4x4',
        'truck' => 'Camion',
        'motorcycle' => 'Moto',
    ];

    const STANDINGS = [
        'standard' => 'Standard',
        'moyen' => 'Moyen standing',
        'haut_de_gamme' => 'Haut de gamme',
    ];

    const TRANSACTION_TYPES = [
        'sale' => 'Vente',
        'rent' => 'Location',
    ];

    const STATUS = [
        'draft' => 'Brouillon',
        'published' => 'Publié',
        'sold' => 'Vendu',
        'rented' => 'Loué',
        'archived' => 'Archivé',
    ];

    // ==================== SCOPES ====================

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeForSale($query)
    {
        return $query->where('transaction_type', 'sale');
    }

    public function scopeForRent($query)
    {
        return $query->where('transaction_type', 'rent');
    }

    public function scopeByStanding($query, string $standing)
    {
        return $query->where('standing', $standing);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByCity($query, string $city)
    {
        return $query->where('city', 'like', "%{$city}%");
    }

    public function scopeByPriceRange($query, float $min, float $max)
    {
        return $query->whereBetween('price', [$min, $max]);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopePremium($query)
    {
        return $query->where('is_premium', true);
    }

    public function scopeOrderByStanding($query)
    {
        return $query->orderByRaw("FIELD(standing, 'haut_de_gamme', 'moyen', 'standard')");
    }

    public function scopeNearby($query, float $lat, float $lng, float $radius = 10)
    {
        // Rayon en kilomètres (formule Haversine simplifiée)
        return $query->whereRaw(
            "(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) <= ?",
            [$lat, $lng, $lat, $radius]
        );
    }

    // ==================== RELATIONS ====================

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function views(): HasMany
    {
        return $this->hasMany(PropertyView::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function contactRequests(): HasMany
    {
        return $this->hasMany(ContactRequest::class);
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }

    // ==================== ACCESSEURS ====================

    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    public function getStandingLabelAttribute(): string
    {
        return self::STANDINGS[$this->standing] ?? $this->standing;
    }

    public function getTransactionTypeLabelAttribute(): string
    {
        return self::TRANSACTION_TYPES[$this->transaction_type] ?? $this->transaction_type;
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUS[$this->status] ?? $this->status;
    }

    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 0, ',', ' ') . ' ' . $this->currency;
    }

    public function getPricePerSqmAttribute(): ?float
    {
        if ($this->area > 0) {
            return round($this->price / $this->area, 2);
        }
        return null;
    }

    public function getMainImageUrlAttribute(): ?string
    {
        return $this->main_image ?? ($this->images[0] ?? null);
    }

    public function getStandingPriorityAttribute(): int
    {
        return match($this->standing) {
            'haut_de_gamme' => 1,
            'moyen' => 2,
            'standard' => 3,
            default => 4,
        };
    }

    // ==================== MÉTHODES ====================

    public function incrementViewCount(): void
    {
        $this->increment('view_count');
    }

    public function incrementContactCount(): void
    {
        $this->increment('contact_count');
    }

    public function isAvailable(): bool
    {
        return in_array($this->status, ['published']) && 
               ($this->expires_at === null || $this->expires_at->isFuture());
    }

    public function publish(): void
    {
        $this->update([
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    public function markAsSold(): void
    {
        $this->update(['status' => 'sold']);
    }

    public function markAsRented(): void
    {
        $this->update(['status' => 'rented']);
    }
}