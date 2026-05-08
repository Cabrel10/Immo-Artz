<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RatingController extends Controller
{
    /**
     * Liste des avis d'un agent
     */
    public function index(Request $request, int $agentId): JsonResponse
    {
        $agent = User::agents()->find($agentId);

        if (!$agent) {
            return response()->json([
                'success' => false,
                'message' => 'Agent non trouvé.',
            ], 404);
        }

        $ratings = Rating::forAgent($agentId)
            ->approved()
            ->with('property:id,title')
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => [
                'agent' => [
                    'id' => $agent->id,
                    'name' => $agent->full_name,
                    'rating_average' => $agent->rating_average,
                    'rating_count' => $agent->rating_count,
                ],
                'ratings' => $ratings->map(fn($r) => $this->formatRating($r)),
                'pagination' => [
                    'current_page' => $ratings->currentPage(),
                    'last_page' => $ratings->lastPage(),
                    'per_page' => $ratings->perPage(),
                    'total' => $ratings->total(),
                ],
            ],
        ]);
    }

    /**
     * Soumettre un avis (avec protection anti-spam)
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'agent_id' => ['required', 'exists:users,id'],
            'property_id' => ['nullable', 'exists:properties,id'],
            'rater_name' => ['required', 'string', 'max:255'],
            'rater_email' => ['required', 'email', 'max:255'],
            'rater_phone' => ['nullable', 'string', 'max:20'],
            'score' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $agentId = $request->agent_id;
        $ip = $request->ip();

        // Vérifier que l'agent existe et est bien un agent
        $agent = User::agents()->find($agentId);
        if (!$agent) {
            return response()->json([
                'success' => false,
                'message' => 'Agent non trouvé.',
            ], 404);
        }

        // Protection anti-spam: vérifier si l'IP a déjà noté cet agent récemment
        if (Rating::hasRatedRecently($agentId, $ip, 24)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà noté cet agent récemment. Veuillez réessayer dans 24 heures.',
                'error_code' => 'RATE_LIMIT',
            ], 429);
        }

        // Créer l'avis
        $rating = Rating::create([
            'agent_id' => $agentId,
            'property_id' => $request->property_id,
            'rater_name' => $request->rater_name,
            'rater_email' => $request->rater_email,
            'rater_phone' => $request->rater_phone,
            'rater_ip' => $ip,
            'score' => $request->score,
            'comment' => $request->comment,
            'status' => 'pending', // Les avis sont modérés
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Votre avis a été soumis et est en attente de modération.',
            'data' => [
                'rating' => $this->formatRating($rating),
            ],
        ], 201);
    }

    /**
     * Approuver un avis (Admin)
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé.',
            ], 403);
        }

        $rating = Rating::find($id);

        if (!$rating) {
            return response()->json([
                'success' => false,
                'message' => 'Avis non trouvé.',
            ], 404);
        }

        if ($rating->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cet avis a déjà été traité.',
            ], 422);
        }

        $rating->approve($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Avis approuvé.',
            'data' => [
                'rating' => $this->formatRating($rating->fresh()),
            ],
        ]);
    }

    /**
     * Rejeter un avis (Admin)
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé.',
            ], 403);
        }

        $rating = Rating::find($id);

        if (!$rating) {
            return response()->json([
                'success' => false,
                'message' => 'Avis non trouvé.',
            ], 404);
        }

        if ($rating->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cet avis a déjà été traité.',
            ], 422);
        }

        $rating->reject($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Avis rejeté.',
        ]);
    }

    /**
     * Liste des avis en attente (Admin)
     */
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé.',
            ], 403);
        }

        $ratings = Rating::pending()
            ->with(['agent:id,first_name,last_name', 'property:id,title'])
            ->orderBy('created_at')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => [
                'ratings' => $ratings->map(fn($r) => $this->formatRating($r, true)),
                'pagination' => [
                    'current_page' => $ratings->currentPage(),
                    'last_page' => $ratings->lastPage(),
                    'per_page' => $ratings->perPage(),
                    'total' => $ratings->total(),
                ],
            ],
        ]);
    }

    /**
     * Statistiques des avis
     */
    public function stats(Request $request, int $agentId): JsonResponse
    {
        $agent = User::agents()->find($agentId);

        if (!$agent) {
            return response()->json([
                'success' => false,
                'message' => 'Agent non trouvé.',
            ], 404);
        }

        $stats = [
            'average' => $agent->rating_average,
            'count' => $agent->rating_count,
            'distribution' => Rating::forAgent($agentId)
                ->approved()
                ->selectRaw('score, COUNT(*) as count')
                ->groupBy('score')
                ->orderBy('score')
                ->pluck('count', 'score'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    // ==================== MÉTHODES PRIVÉES ====================

    private function formatRating(Rating $rating, bool $includeIp = false): array
    {
        $data = [
            'id' => $rating->id,
            'agent_id' => $rating->agent_id,
            'property_id' => $rating->property_id,
            'rater_name' => $rating->rater_name,
            'score' => $rating->score,
            'stars' => Rating::getStarsAttribute($rating->score),
            'comment' => $rating->comment,
            'status' => $rating->status,
            'created_at' => $rating->created_at->toIso8601String(),
        ];

        if ($rating->relationLoaded('property') && $rating->property) {
            $data['property'] = [
                'id' => $rating->property->id,
                'title' => $rating->property->title,
            ];
        }

        if ($rating->relationLoaded('agent') && $rating->agent) {
            $data['agent'] = [
                'id' => $rating->agent->id,
                'name' => $rating->agent->full_name,
            ];
        }

        if ($includeIp) {
            $data['rater_email'] = $rating->rater_email;
            $data['rater_phone'] = $rating->rater_phone;
            $data['rater_ip'] = $rating->rater_ip;
        }

        return $data;
    }
}
