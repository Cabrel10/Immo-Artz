<?php

namespace App\Console;

use App\Console\Commands\RotateCatalogPassword;
use App\Models\CatalogPassword;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Commandes Artisan enregistrées
     */
    protected $commands = [
        RotateCatalogPassword::class,
        \App\Console\Commands\CreateAdmin::class,
    ];

    /**
     * Définir la planification des tâches
     */
    protected function schedule(Schedule $schedule): void
    {
        // Rotation automatique du mot de passe toutes les 12 heures
        $schedule->command('catalog:rotate-password')
            ->twiceDaily(0, 12) // À minuit et midi
            ->timezone('Africa/Douala')
            ->withoutOverlapping()
            ->onOneServer()
            ->appendOutputTo(storage_path('logs/catalog-password-rotation.log'));

        // Nettoyage des mots de passe expirés toutes les heures
        $schedule->call(function () {
            CatalogPassword::cleanupExpired();
        })->hourly();

        // Backup de la base de données (quotidien à 2h du matin)
        $schedule->command('backup:run --only-db')
            ->dailyAt('02:00')
            ->timezone('Africa/Douala')
            ->withoutOverlapping();

        // Nettoyage des logs d'accès anciens (+30 jours)
        $schedule->call(function () {
            \App\Models\CatalogAccessLog::where('accessed_at', '<', now()->subDays(30))->delete();
            \App\Models\PropertyView::where('viewed_at', '<', now()->subDays(90))->delete();
        })->weekly();
    }

    /**
     * Enregistrer les commandes
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}