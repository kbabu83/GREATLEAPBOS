<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Central Web Routes
| Serves the React SPA for the central domain
|--------------------------------------------------------------------------
*/

// Diagnostic route to verify deployment
Route::get('/diagnostic-check', function () {
    return response()->json([
        'message' => 'Pong - Web Verifier V1',
        'status' => 'Deployment is reaching web routes',
        'time' => now()->toDateTimeString(),
    ]);
});

// SPA catch-all — must NOT match /api/* paths (those are handled by routes/api.php)
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
