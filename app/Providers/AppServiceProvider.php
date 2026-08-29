<?php

namespace App\Providers;

use App\Listeners\ContarEmailEnviado;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Contar emails enviados — alimenta el dashboard de costos
        Event::listen(MessageSent::class, ContarEmailEnviado::class);
    }
}
