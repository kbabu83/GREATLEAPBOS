<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class DebugController extends Controller
{
    public function ping(): JsonResponse
    {
        return response()->json([
            'message' => 'Pong!',
            'status' => 'Server is responding to new routes',
            'time' => now()->toDateTimeString(),
        ]);
    }
}
