<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    /** @var \Illuminate\Foundation\Console\ClosureCommand $this */
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Rotation automatique du mot de passe catalogue (toutes les 12h)
Schedule::command('catalog:rotate-password')
    ->twiceDaily(0, 12)
    ->timezone('Africa/Douala')
    ->withoutOverlapping();
