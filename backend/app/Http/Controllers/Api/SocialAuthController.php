<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Redirection vers Google
     */
    public function redirectToGoogle(): JsonResponse
    {
        $url = Socialite::driver('google')
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json([
            'success' => true,
            'data' => [
                'url' => $url,
            ],
        ]);
    }

    /**
     * Callback Google
     */
    public function handleGoogleCallback(Request $request): JsonResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            // Chercher l'utilisateur par email
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Utilisateur existant - mettre à jour les infos Google si nécessaire
                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar(),
                    ]);
                }
            } else {
                // Créer un nouvel utilisateur
                $nameParts = $this->splitName($googleUser->getName());
                
                $user = User::create([
                    'first_name' => $nameParts['first_name'],
                    'last_name' => $nameParts['last_name'],
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'password' => Hash::make(Str::random(32)),
                    'role' => 'visitor',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]);
            }

            // Créer le token Sanctum
            $token = $user->createToken('google_auth', [$user->role])->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie avec Google.',
                'data' => [
                    'user' => $this->formatUser($user),
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'is_new_user' => $user->wasRecentlyCreated,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'authentification Google.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Connexion avec token Google (pour mobile/SPA)
     */
    public function loginWithGoogleToken(Request $request): JsonResponse
    {
        $request->validate([
            'access_token' => ['required', 'string'],
        ]);

        try {
            // Vérifier le token avec Google
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->userFromToken($request->access_token);

            if (!$googleUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token Google invalide.',
                ], 401);
            }

            // Chercher ou créer l'utilisateur
            $user = User::firstOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'first_name' => explode(' ', $googleUser->getName())[0] ?? 'Utilisateur',
                    'last_name' => explode(' ', $googleUser->getName())[1] ?? '',
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'password' => Hash::make(Str::random(32)),
                    'role' => 'visitor',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]
            );

            // Mettre à jour google_id si pas déjà fait
            if (!$user->google_id) {
                $user->update(['google_id' => $googleUser->getId()]);
            }

            $token = $user->createToken('google_auth', [$user->role])->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie.',
                'data' => [
                    'user' => $this->formatUser($user),
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'is_new_user' => $user->wasRecentlyCreated,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur d\'authentification.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lier un compte Google à un utilisateur existant
     */
    public function linkGoogleAccount(Request $request): JsonResponse
    {
        $request->validate([
            'access_token' => ['required', 'string'],
        ]);

        $user = $request->user();

        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->userFromToken($request->access_token);

            // Vérifier si l'email est déjà lié à un autre compte
            $existingUser = User::where('google_id', $googleUser->getId())
                ->where('id', '!=', $user->id)
                ->first();

            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce compte Google est déjà lié à un autre utilisateur.',
                ], 422);
            }

            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar' => $user->avatar ?? $googleUser->getAvatar(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Compte Google lié avec succès.',
                'data' => [
                    'user' => $this->formatUser($user),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la liaison du compte.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Délier le compte Google
     */
    public function unlinkGoogleAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->google_id) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun compte Google lié.',
            ], 422);
        }

        $user->update(['google_id' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Compte Google délié avec succès.',
        ]);
    }

    /**
     * Séparer le nom en prénom et nom
     */
    private function splitName(string $fullName): array
    {
        $parts = explode(' ', $fullName, 2);
        return [
            'first_name' => $parts[0] ?? 'Utilisateur',
            'last_name' => $parts[1] ?? '',
        ];
    }

    /**
     * Formater les données utilisateur
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'status' => $user->status,
            'avatar' => $user->avatar,
            'google_connected' => !is_null($user->google_id),
            'created_at' => $user->created_at->toIso8601String(),
        ];
    }
}