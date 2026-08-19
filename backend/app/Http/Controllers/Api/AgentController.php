<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    /**
     * Liste publique des agents actifs
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::agents()
            ->active()
            ->withCount(['properties' => fn ($q) => $q->where('status', 'published')]);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('agency_name', 'like', "%{$search}%");
            });
        }

        $agents = $query
            ->orderByDesc('rating_average')
            ->paginate($request->input('per_page', 12));

        return response()->json([
            'success' => true,
            'data' => [
                'agents' => $agents->map(fn ($a) => $this->formatAgent($a)),
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
     * Fiche publique d'un agent (avec ses biens publiés)
     */
    public function show(int $id): JsonResponse
    {
        $agent = User::agents()
            ->active()
            ->withCount(['properties' => fn ($q) => $q->where('status', 'published')])
            ->find($id);

        if (!$agent) {
            return response()->json([
                'success' => false,
                'message' => 'Agent non trouvé.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => ['agent' => $this->formatAgent($agent, true)],
        ]);
    }

    /**
     * Liste des agents (Admin) — inclut inactifs/suspendus
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $agents = User::agents()
            ->withCount(['properties' => fn ($q) => $q->where('status', 'published')])
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => [
                'agents' => $agents->map(fn ($a) => array_merge($this->formatAgent($a), [
                    'status' => $a->status,
                    'created_at' => $a->created_at->toIso8601String(),
                ])),
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
     * Activer / suspendre un agent (Admin)
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $agent = User::agents()->find($id);

        if (!$agent) {
            return response()->json([
                'success' => false,
                'message' => 'Agent non trouvé.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:active,inactive,suspended'],
        ]);

        $agent->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Statut de l\'agent mis à jour.',
            'data' => ['agent' => array_merge($this->formatAgent($agent), ['status' => $agent->status])],
        ]);
    }

    private function formatAgent(User $agent, bool $withDetails = false): array
    {
        $data = [
            'id' => $agent->id,
            'name' => $agent->full_name,
            'first_name' => $agent->first_name,
            'last_name' => $agent->last_name,
            'email' => $agent->email,
            'phone' => $agent->phone,
            'agency' => $agent->agency_name,
            'avatar' => $agent->avatar,
            'rating' => (float) $agent->rating_average,
            'rating_count' => $agent->rating_count,
            'properties_count' => $agent->properties_count ?? 0,
        ];

        if ($withDetails) {
            $data['bio'] = $agent->bio;
            $data['license_number'] = $agent->license_number;
        }

        return $data;
    }
}
