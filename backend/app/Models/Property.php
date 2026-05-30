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
        'featured_order',
        'featured_until',
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
        'featured_until' => 'datetime',
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

    /**
     * Tri par standing — Cross-DB compatible (MySQL + PostgreSQL + SQLite).
     * Utilise CASE WHEN au lieu de FIELD() (spécifique MySQL).
     */
    public function scopeOrderByStanding($query)
    {
        return $query->orderByRaw(
            "CASE standing WHEN 'haut_de_gamme' THEN 1 WHEN 'moyen' THEN 2 WHEN 'standard' THEN 3 ELSE 4 END"
        );
    }

    /**
     * Recherche par proximité géographique — Cross-DB compatible.
     * Formule de Haversine implémentée en SQL standard (fonctionne MySQL/PostgreSQL/SQLite si extensions math chargées).
     * En SQLite (tests), on rapatrie le filtrage en PHP via le scope alternatif.
     */
    public function scopeNearby($query, float $lat, float $lng, float $radius = 10)
    {
        $driver = $query->getQuery()->getConnection()->getDriverName();

        // SQLite (tests) : pas de cos/sin natifs — approximation par bounding-box
        if ($driver === 'sqlite') {
            $latDelta = $radius / 111.0; // ~111 km par degré
            $lngDelta = $radius / (111.0 * max(cos(deg2rad($lat)), 0.01));
            return $query
                ->whereBetween('latitude', [$lat - $latDelta, $lat + $latDelta])
                ->whereBetween('longitude', [$lng - $lngDelta, $lng + $lngDelta]);
        }

        // MySQL & PostgreSQL : Haversine SQL standard
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