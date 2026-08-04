<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactRequest;
use App\Models\Property;
use App\Models\PropertyView;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Espace agent : page publique d'un agent + stats personnelles.
 */
class AgentController extends Controller
{
    /**
     * Profil public d'un agent + ses biens actifs + stats avis.
     */
    public function show(int $id): JsonResponse
    {
        $agent = User::agents()
            ->where('status', 'active')
            ->find($id);

        if (!$agent) {
            return response()->json([
                'success' => false,
                'message' => 'Agent non trouvé.',
            ], 404);
        }

        $properties = Property::published()
            ->where('agent_id', $agent->id)
            ->orderByStanding()
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'agent' => [
                    'id' => $agent->id,
                    'name' => $agent->full_name,
                    'first_name' => $agent->first_name,
                    'last_name' => $agent->last_name,
                    'phone' => $agent->phone,
                    'email' => $agent->email,
                    'avatar' => $agent->avatar,
                    'bio' => $agent->bio,
                    'agency_name' => $agent->agency_name,
                    'license_number' => $agent->license_number,
                    'rating_average' => (float) $agent->rating_average,
                    'rating_count' => (int) $agent->rating_count,
                    'created_at' => $agent->created_at->toIso8601String(),
                ],
                'properties' => $properties->map(fn($p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'type' => $p->type,
                    'type_label' => $p->type_label,
                    'standing' => $p->standing,
                    'standing_label' => $p->standing_label,
                    'transaction_type' => $p->transaction_type,
                    'price' => $p->price,
                    'formatted_price' => $p->formatted_price,
                    'currency' => $p->currency,
                    'area' => $p->area,
                    'bedrooms' => $p->bedrooms,
                    'bathrooms' => $p->bathrooms,
                    'main_image' => $p->main_image_url,
                    'city' => $p->city,
                    'quartier' => $p->quartier,
                    'is_featured' => $p->is_featured,
                    'is_premium' => $p->is_premium,
                    'status' => $p->status,
                ]),
                'stats' => [
                    'properties_count' => $properties->count(),
                    'total_views' => $properties->sum('view_count'),
                ],
            ],
        ]);
    }

    /**
     * Liste publique des agents (top-rated).
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::agents()->where('status', 'active');

        if ($request->has('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                  ->orWhere('last_name', 'like', "%{$s}%")
                  ->orWhere('agency_name', 'like', "%{$s}%");
            });
        }

        $agents = $query->orderByDesc('rating_average')
            ->orderByDesc('rating_count')
            ->paginate($request->input('per_page', 12));

        return response()->json([
            'success' => true,
            'data' => [
                'agents' => $agents->getCollection()->map(fn($a) => [
                    'id' => $a->id,
                    'name' => $a->full_name,
                    'avatar' => $a->avatar,
                    'agency_name' => $a->agency_name,
                    'phone' => $a->phone,
                    'rating_average' => (float) $a->rating_average,
                    'rating_count' => (int) $a->rating_count,
                    'bio' => $a->bio,
                ]),
                'pagination' => [
                    'current_page' => $agents->currentPage(),
                    'last_page' => $agents->lastPage(),
                    'per_page' => $agents->perPage(),
                    'total' => $agents->total(),
                ],
            ],
        ]);
    }

    /**
     * Statistiques personnelles de l'agent connecté (Dashboard).
     */
    public function myStats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAgent() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé.',
            ], 403);
        }

        $propertyIds = Property::where('agent_id', $user->id)->pluck('id');

        $stats = [
            'properties' => [
                'total' => $propertyIds->count(),
                'published' => Property::where('agent_id', $user->id)->where('status', 'published')->count(),
                'draft' => Property::where('agent_id', $user->id)->where('status', 'draft')->count(),
                'sold' => Property::where('agent_id', $user->id)->where('status', 'sold')->count(),
                'rented' => Property::where('agent_id', $user->id)->where('status', 'rented')->count(),
                'featured' => Property::where('agent_id', $user->id)->where('is_featured', true)->count(),
            ],
            'views' => [
                'total' => $propertyIds->isEmpty() ? 0 : PropertyView::whereIn('property_id', $propertyIds)->count(),
                'this_week' => $propertyIds->isEmpty() ? 0 : PropertyView::whereIn('property_id', $propertyIds)
                    ->where('viewed_at', '>=', now()->startOfWeek())->count(),
                'today' => $propertyIds->isEmpty() ? 0 : PropertyView::whereIn('property_id', $propertyIds)
                    ->whereDate('viewed_at', today())->count(),
            ],
            'contacts' => [
                'total' => ContactRequest::where('agent_id', $user->id)->count(),
                'new' => ContactRequest::where('agent_id', $user->id)->where('status', 'new')->count(),
                'this_week' => ContactRequest::where('agent_id', $user->id)
                    ->where('created_at', '>=', now()->startOfWeek())->count(),
            ],
            'ratings' => [
                'average' => (float) $user->rating_average,
                'count' => (int) $user->rating_count,
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
