<?php

namespace App\Providers;

use App\Models\Bien;
use App\Models\Prospect;
use App\Observers\BienObserver;
use App\Observers\ProspectObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Bien::observe(BienObserver::class);
        Prospect::observe(ProspectObserver::class);
    }
}
