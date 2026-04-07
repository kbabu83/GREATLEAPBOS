<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Register missing aliases that stancl/tenancy and Laravel 11 need.
        // Laravel 11 dropped the old Http/Kernel.php so 'session' is no longer
        // auto-aliased — stancl's bootstrappers rely on it being resolvable.
        $middleware->alias([
            'session' => \Illuminate\Session\Middleware\StartSession::class,
            'role'    => \App\Http\Middleware\CheckRole::class,
            'tenant'  => \App\Http\Middleware\InitializeTenancyByDomain::class,
            'check-feature' => \App\Http\Middleware\CheckFeature::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
