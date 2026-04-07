<?php

return [
    'name'           => env('APP_NAME', 'Great Leap App'),
    'env'            => env('APP_ENV', 'production'),
    'debug'          => (bool) env('APP_DEBUG', false),
    'url'            => env('APP_URL', 'http://localhost'),
    'frontend_url'   => env('FRONTEND_URL', env('APP_URL', 'http://localhost')),
    'asset_url'      => env('ASSET_URL'),
    'timezone'       => 'UTC',
    'locale'         => env('APP_LOCALE', 'en'),
    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),
    'faker_locale'   => env('APP_FAKER_LOCALE', 'en_US'),
    'cipher'         => 'AES-256-CBC',
    'key'            => env('APP_KEY'),
    'previous_keys'  => [
        ...array_filter(
            explode(',', env('APP_PREVIOUS_KEYS', ''))
        ),
    ],
    'maintenance' => [
        'driver' => 'file',
    ],
    /*
     * Use Laravel's default provider list so no core provider (Session, Cookie,
     * Routing, etc.) is accidentally omitted, then merge in app-specific ones.
     */
    'providers' => Illuminate\Support\ServiceProvider::defaultProviders()->merge([
        App\Providers\AppServiceProvider::class,
        App\Providers\TenancyServiceProvider::class,
        Laravel\Sanctum\SanctumServiceProvider::class,
    ])->toArray(),
    'aliases' => Illuminate\Support\Facades\Facade::defaultAliases()->merge([
        // 'Example' => App\Facades\Example::class,
    ])->toArray(),
];
