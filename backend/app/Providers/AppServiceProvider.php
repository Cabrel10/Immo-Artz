<?php

namespace App\Providers;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Schema::defaultStringLength(191);
        
        // Configurer le locale pour le Cameroun
        setlocale(LC_TIME, 'fr_FR.utf8', 'fr_FR', 'fr', 'french');
    }
}
