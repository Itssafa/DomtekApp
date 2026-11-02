<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Publier automatiquement les annonces planifiées toutes les minutes
Schedule::command('annonces:publier')->everyMinute();

// File d'attente (recalcul des suggestions par l'IA) : traitée chaque minute
// par le conteneur « scheduler », sans conteneur dédié.
Schedule::command('queue:work --stop-when-empty --tries=2 --max-time=55')
    ->everyMinute()
    ->withoutOverlapping();
