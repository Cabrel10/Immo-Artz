<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PropertyController extends Controller
{
    /**
     * Liste des propriétés avec filtres
     */
    public function index(Request $request): JsonResponse
    {
        $query = Property::published()->with('agent:id,first_name,last_name,phone,email,agency_name,rating_average');

        // Filtres
        if ($request->has('type')) {
            $query->byType($request->type);
        }

        if ($request->has('standing')) {
            $query->byStanding($request->standing);
        }

        if ($request->has('transaction_type')) {
            $query->where('transaction_type', $request->transaction_type);
        }

        if ($request->has('city')) {
            $query->byCity($request->city);
        }

        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->has('min_area')) {
            $query->where('area', '>=', $request->min_area);
        }

        if ($request->has('max_area')) {
            $query->where('area', '<=', $request->max_area);
        }

        if ($request->has('bedrooms')) {
            $query->where('bedrooms', '>=', $request->bedrooms);
        }
        if ($request->has('furnished')) {
            $query->where('is_furnished', $request->boolean('furnished'));
        }

        if ($request->has('features')) {
            $features = is_array($request->features) ? $request->features : explode(',', $request->features);
            foreach ($features as $feature) {
                $query->whereJsonContains('features', $feature);
            }
        }

        // Recherche par mot-clé
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('quartier', 'like', "%{$search}%");
            });
        }

        // Tri
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        switch ($sortBy) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'standing':
                $query->orderByStanding();
                break;
            case 'popular':
                $query->orderByDesc('view_count');
                break;
            default:
                $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination
        $perPage = $request->input('per_page', 12);
        $properties = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'properties' => $properties->map(fn($p) => $this->formatProperty($p, false)),
                'pagination' => [
                    'current_page' => $properties->currentPage(),
                    'last_page' => $properties->lastPage(),
                    'per_page' => $properties->perPage(),
                    'total' => $properties->total(),
                ],
            ],
        ]);
    }

    /**
     * Détail d'une propriété
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $property = Property::published()
            ->with('agent:id,first_name,last_name,phone,email,agency_name,rating_average,rating_count,bio')
            ->find($id);

        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'Propriété non trouvée.',
            ], 404);
        }

        // Enregistrer la vue (une fois par IP par jour)
        $ip = $request->ip();
        $alreadyViewed = PropertyView::forProperty($id)
            ->where('ip_address', $ip)
            ->whereDate('viewed_at', today())
            ->exists();

        if (!$alreadyViewed) {
            PropertyView::create([
                'property_id' => $id,
                'ip_address' => $ip,
                'user_agent' => $request->userAgent(),
                'referrer' => $request->header('referer'),
                'viewed_at' => now(),
            ]);
            $property->incrementViewCount();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'property' => $this->formatProperty($property, true),
            ],
        ]);
    }

    /**
     * Créer une propriété (Agent/Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->isAgent() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé.',
            ], 403);
        }

        $validator = Validator::make($request->all(), $this->getValidationRules());

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $data['agent_id'] = $user->isAgent() ? $user->id : $request->input('agent_id');

        // Gestion des images
        if ($request->hasFile('images')) {
            $images = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('properties', 'public');
                $images[] = asset('storage/' . $path);
            }
            $data['images'] = $images;
            $data['main_image'] = $images[0] ?? null;
        }

        $property = Property::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Propriété créée avec succès.',
            'data' => [
                'property' => $this->formatProperty($property),
            ],
        ], 201);
    }

    /**
     * Mettre à jour une propriété
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $property = Property::find($id);

        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'Propriété non trouvée.',
            ], 404);
        }

        // Vérifier les permissions
        if (!$user->isAdmin() && $property->agent_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé.',
            ], 403);
        }

        $validator = Validator::make($request->all(), $this->getValidationRules(true));

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Gestion des images
        if ($request->hasFile('images')) {
            // Supprimer les anciennes images
            if ($property->images) {
                foreach ($property->images as $oldImage) {
                    $path = str_replace(asset('storage/'), '', $oldImage);
                    Storage::disk('public')->delete($path);
                }
            }

            $images = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('properties', 'public');
                $images[] = asset('storage/' . $path);
            }
            $data['images'] = $images;
            $data['main_image'] = $images[0] ?? null;
        }

        $property->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Propriété mise à jour.',
            'data' => [
                'property' => $this->formatProperty($property),
            ],
        ]);
    }

    /**
     * Supprimer une propriété
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $property = Property::find($id);

        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'Propriété non trouvée.',
            ], 404);
        }

        if (!$user->isAdmin() && $property->agent_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé.',
            ], 403);
        }

        // Suppression soft
        $property->delete();

        return response()->json([
            'success' => true,
            'message' => 'Propriété supprimée.',
        ]);
    }

    /**
     * Propriétés de l'agent connecté
     */
    public function myProperties(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $query = Property::where('agent_id', $user->id)
            ->withCount('views', 'favorites', 'contactRequests');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $properties = $query->orderByDesc('created_at')->paginate($request->input('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => [
                'properties' => $properties->map(fn($p) => array_merge(
                    $this->formatProperty($p),
                    [
                        'views_count' => $p->views_count,
                        'favorites_count' => $p->favorites_count,
                        'contacts_count' => $p->contact_requests_count,
                    ]
                )),
                'pagination' => [
                    'current_page' => $properties->currentPage(),
                    'last_page' => $properties->lastPage(),
                    'per_page' => $properties->perPage(),
                    'total' => $properties->total(),
                ],
            ],
        ]);
    }

    /**
     * Propriétés en vedette
     */
    public function featured(Request $request): JsonResponse
    {
        $properties = Property::published()
            ->featured()
            ->with('agent:id,first_name,last_name,agency_name,rating_average')
            ->orderByDesc('is_premium')
            ->orderByDesc('created_at')
            ->limit($request->input('limit', 6))
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'properties' => $properties->map(fn($p) => $this->formatProperty($p, false)),
            ],
        ]);
    }

    /**
     * Recherche par proximité géographique
     */
    public function nearby(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'radius' => ['sometimes', 'numeric', 'min:1', 'max:100'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $properties = Property::published()
            ->nearby($request->lat, $request->lng, $request->input('radius', 10))
            ->with('agent:id,first_name,last_name')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'properties' => $properties->map(fn($p) => array_merge(
                    $this->formatProperty($p, false),
                    ['distance_km' => $this->calculateDistance($request->lat, $request->lng, $p->latitude, $p->longitude)]
                )),
            ],
        ]);
    }

    /**
     * Statistiques des propriétés (Admin)
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé.',
            ], 403);
        }

        $stats = [
            'total' => Property::count(),
            'published' => Property::published()->count(),
            'draft' => Property::where('status', 'draft')->count(),
            'sold' => Property::where('status', 'sold')->count(),
            'rented' => Property::where('status', 'rented')->count(),
            'by_type' => Property::selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type'),
            'by_standing' => Property::selectRaw('standing, COUNT(*) as count')
                ->groupBy('standing')
                ->pluck('count', 'standing'),
            'by_city' => Property::selectRaw('city, COUNT(*) as count')
                ->groupBy('city')
                ->orderByDesc('count')
                ->limit(10)
                ->pluck('count', 'city'),
            'total_views' => PropertyView::count(),
            'views_today' => PropertyView::today()->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    // ==================== MÉTHODES PRIVÉES ====================

    private function getValidationRules(bool $isUpdate = false): array
    {
        $rules = [
            'title' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => [$isUpdate ? 'sometimes' : 'required', 'string'],
            'type' => [$isUpdate ? 'sometimes' : 'required', 'in:apartment,house,villa,land,commercial,office'],
            'standing' => [$isUpdate ? 'sometimes' : 'required', 'in:standard,moyen,haut_de_gamme'],
            'transaction_type' => [$isUpdate ? 'sometimes' : 'required', 'in:sale,rent'],
            'price' => [$isUpdate ? 'sometimes' : 'required', 'numeric', 'min:0'],
            'area' => [$isUpdate ? 'sometimes' : 'required', 'numeric', 'min:0'],
            'bedrooms' => ['nullable', 'integer', 'min:0'],
            'bathrooms' => ['nullable', 'integer', 'min:0'],
            'parking_spaces' => ['nullable', 'integer', 'min:0'],
            'floor' => ['nullable', 'integer', 'min:0'],
            'total_floors' => ['nullable', 'integer', 'min:0'],
            'construction_year' => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'is_furnished' => ['nullable', 'boolean'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string'],
            'images' => [$isUpdate ? 'nullable' : 'required', 'array', 'min:1', 'max:20'],
            'images.*' => ['image', 'max:5120'], // 5MB max
            'video_url' => ['nullable', 'url'],
            'virtual_tour_url' => ['nullable', 'url'],
            'address' => [$isUpdate ? 'sometimes' : 'required', 'string'],
            'city' => [$isUpdate ? 'sometimes' : 'required', 'string'],
            'quartier' => [$isUpdate ? 'sometimes' : 'required', 'string'],
            'postal_code' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_premium' => ['sometimes', 'boolean'],
        ];

        return $rules;
    }

    private function formatProperty(Property $property, bool $includeDetails = false): array
    {
        $data = [
            'id' => $property->id,
            'title' => $property->title,
            'description' => $property->description,
            'type' => $property->type,
            'type_label' => $property->type_label,
            'standing' => $property->standing,
            'standing_label' => $property->standing_label,
            'standing_priority' => $property->standing_priority,
            'transaction_type' => $property->transaction_type,
            'transaction_type_label' => $property->transaction_type_label,
            'price' => $property->price,
            'formatted_price' => $property->formatted_price,
            'currency' => $property->currency,
            'area' => $property->area,
            'price_per_sqm' => $property->price_per_sqm,
            'bedrooms' => $property->bedrooms,
            'bathrooms' => $property->bathrooms,
            'parking_spaces' => $property->parking_spaces,
            'floor' => $property->floor,
            'total_floors' => $property->total_floors,
            'construction_year' => $property->construction_year,
            'is_furnished' => (bool) $property->is_furnished,
            'features' => $property->features,
            'main_image' => $property->main_image_url,
            'images' => $property->images,
            'city' => $property->city,
            'quartier' => $property->quartier,
            'address' => $property->address,
            'latitude' => $property->latitude,
            'longitude' => $property->longitude,
            'status' => $property->status,
            'is_featured' => $property->is_featured,
            'is_premium' => $property->is_premium,
            'view_count' => $property->view_count,
            'contact_count' => $property->contact_count,
            'created_at' => $property->created_at->toIso8601String(),
            'agent' => $property->agent ? [
                'id' => $property->agent->id,
                'name' => $property->agent->full_name,
                'phone' => $property->agent->phone,
                'email' => $property->agent->email,
                'agency' => $property->agent->agency_name,
                'rating' => $property->agent->rating_average,
            ] : null,
        ];

        if ($includeDetails) {
            $data['video_url'] = $property->video_url;
            $data['virtual_tour_url'] = $property->virtual_tour_url;
            $data['postal_code'] = $property->postal_code;
            $data['agent']['bio'] = $property->agent->bio ?? null;
            $data['agent']['rating_count'] = $property->agent->rating_count ?? 0;
        }

        return $data;
    }

    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // Rayon de la Terre en km

        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lngDelta / 2) * sin($lngDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }
}
