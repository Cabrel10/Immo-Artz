<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    /**
     * Liste des favoris de l'utilisateur connecté
     */
    public function index(Request $request): JsonResponse
    {
        $favorites = Favorite::where('user_id', $request->user()->id)
            ->with(['property' => fn ($q) => $q->with('agent:id,first_name,last_name,phone,email,agency_name,rating_average')])
            ->orderByDesc('created_at')
            ->get()
            ->filter(fn ($f) => $f->property !== null)
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'favorites' => $favorites->map(fn ($f) => [
                    'id' => $f->id,
                    'property_id' => $f->property_id,
                    'created_at' => $f->created_at->toIso8601String(),
                    'property' => $this->formatProperty($f->property),
                ]),
            ],
        ]);
    }

    /**
     * IDs des propriétés favorites (pour marquer les coeurs côté frontend)
     */
    public function ids(Request $request): JsonResponse
    {
        $ids = Favorite::where('user_id', $request->user()->id)->pluck('property_id');

        return response()->json([
            'success' => true,
            'data' => ['ids' => $ids],
        ]);
    }

    /**
     * Ajouter / retirer un favori (toggle)
     */
    public function toggle(Request $request, int $propertyId): JsonResponse
    {
        $property = Property::find($propertyId);

        if (!$property) {
            return response()->json([
                'success' => false,
                'message' => 'Bien non trouvé.',
            ], 404);
        }

        $existing = Favorite::where('user_id', $request->user()->id)
            ->where('property_id', $propertyId)
            ->first();

        if ($existing) {
            $existing->delete();

            return response()->json([
                'success' => true,
                'message' => 'Retiré des favoris.',
                'data' => ['is_favorite' => false],
            ]);
        }

        Favorite::create([
            'user_id' => $request->user()->id,
            'property_id' => $propertyId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ajouté aux favoris.',
            'data' => ['is_favorite' => true],
        ], 201);
    }

    private function formatProperty(Property $property): array
    {
        return [
            'id' => $property->id,
            'title' => $property->title,
            'type' => $property->type,
            'type_label' => $property->type_label,
            'standing' => $property->standing,
            'standing_label' => $property->standing_label,
            'transaction_type' => $property->transaction_type,
            'transaction_type_label' => $property->transaction_type_label,
            'price' => $property->price,
            'formatted_price' => $property->formatted_price,
            'currency' => $property->currency,
            'area' => $property->area,
            'bedrooms' => $property->bedrooms,
            'bathrooms' => $property->bathrooms,
            'is_furnished' => (bool) $property->is_furnished,
            'main_image' => $property->main_image_url,
            'images' => $property->images,
            'city' => $property->city,
            'quartier' => $property->quartier,
            'status' => $property->status,
            'is_featured' => $property->is_featured,
            'is_premium' => $property->is_premium,
            'agent' => $property->agent ? [
                'id' => $property->agent->id,
                'name' => $property->agent->full_name,
                'phone' => $property->agent->phone,
                'email' => $property->agent->email,
                'agency' => $property->agent->agency_name,
                'rating' => $property->agent->rating_average,
            ] : null,
        ];
    }
}
