<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Central Web Routes
| Serves the React SPA for the central domain
|--------------------------------------------------------------------------
*/

// SPA catch-all — must NOT match /api/* paths (those are handled by routes/api.php)
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
