<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\RatingController;
use App\Http\Controllers\Api\SocialAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - IMMO Platform
|--------------------------------------------------------------------------
*/

// ==================== ROUTES PUBLIQUES ====================

// Authentification
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Authentification Sociale (Google)
Route::get('/auth/google', [SocialAuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);
Route::post('/auth/google/token', [SocialAuthController::class, 'loginWithGoogleToken']);

// Agents (lecture publique)
Route::get('/agents', [AgentController::class, 'index']);
Route::get('/agents/{id}', [AgentController::class, 'show']);

// Propriétés (lecture publique)
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/featured', [PropertyController::class, 'featured']);
Route::get('/properties/nearby', [PropertyController::class, 'nearby']);
Route::get('/properties/{id}', [PropertyController::class, 'show']);

// Avis (lecture publique)
Route::get('/agents/{agentId}/ratings', [RatingController::class, 'index']);
Route::get('/agents/{agentId}/ratings/stats', [RatingController::class, 'stats']);
Route::post('/ratings', [RatingController::class, 'store']);

// Catalogue (avec vérification mot de passe)
Route::post('/catalog/verify', [CatalogController::class, 'verify']);
Route::post('/catalog/purchase', [CatalogController::class, 'purchase']);
Route::get('/catalog/download', [CatalogController::class, 'download']);
Route::get('/catalog', [CatalogController::class, 'show']);

// ==================== ROUTES PROTÉGÉES ====================

Route::middleware(['auth:sanctum'])->group(function () {
    
    // Authentification
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/password', [AuthController::class, 'changePassword']);
    
    // Gestion compte Google lié
    Route::post('/auth/google/link', [SocialAuthController::class, 'linkGoogleAccount']);
    Route::post('/auth/google/unlink', [SocialAuthController::class, 'unlinkGoogleAccount']);

    // Propriétés (CRUD pour agents/admins)
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::put('/properties/{id}', [PropertyController::class, 'update']);
    Route::delete('/properties/{id}', [PropertyController::class, 'destroy']);
    Route::get('/my-properties', [PropertyController::class, 'myProperties']);

    // Favoris
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::get('/favorites/ids', [FavoriteController::class, 'ids']);
    Route::post('/favorites/{propertyId}/toggle', [FavoriteController::class, 'toggle']);

    // ==================== ROUTES ADMIN ====================
    
    Route::middleware(['role:admin'])->group(function () {
        
        // Statistiques
        Route::get('/stats/properties', [PropertyController::class, 'stats']);
        Route::get('/stats/catalog', [CatalogController::class, 'stats']);
        
        // Gestion des avis
        Route::get('/ratings/pending', [RatingController::class, 'pending']);
        Route::post('/ratings/{id}/approve', [RatingController::class, 'approve']);
        Route::post('/ratings/{id}/reject', [RatingController::class, 'reject']);
        
        // Gestion du catalogue
        Route::get('/catalog/password', [CatalogController::class, 'currentPassword']);
        Route::post('/catalog/rotate', [CatalogController::class, 'rotate']);
        Route::get('/catalog/history', [CatalogController::class, 'history']);
        
        // Gestion des biens en vedette (Admin)
        Route::get('/admin/properties', [AdminController::class, 'properties']);
        Route::get('/admin/properties/featured', [AdminController::class, 'featuredProperties']);
        Route::post('/admin/properties/{id}/featured', [AdminController::class, 'toggleFeatured']);
        Route::post('/admin/properties/featured/order', [AdminController::class, 'setFeaturedOrder']);
        Route::get('/admin/dashboard', [AdminController::class, 'dashboardStats']);

        // Gestion des agents (Admin)
        Route::get('/admin/agents', [AgentController::class, 'adminIndex']);
        Route::put('/admin/agents/{id}/status', [AgentController::class, 'updateStatus']);
    });
});

// ==================== ROUTES DE FALLBACK ====================

Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'Route non trouvée.',
    ], 404);
});