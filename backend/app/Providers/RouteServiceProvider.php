<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * Chemin vers le fichier de routes API
     */
    protected $namespace = 'App\\Http\\Controllers';

    /**
     * Bootstrap des services
     */
    public function boot(): void
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api/v1')
                ->namespace($this->namespace)
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->namespace($this->namespace)
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configurer le rate limiting
     */
    protected function configureRateLimiting(): void
    {
        // Rate limiting global pour l'API
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limiting strict pour le catalogue (protection contre le brute force)
        RateLimiter::for('catalog', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // Rate limiting pour l'authentification
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Rate limiting pour les avis (protection anti-spam)
        RateLimiter::for('ratings', function (Request $request) {
            return Limit::perHour(3)->by($request->ip());
        });
    }
}
