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

    public function getLogs(): JsonResponse
    {
        $logPath = storage_path('logs/laravel.log');
        
        if (!file_exists($logPath)) {
            return response()->json(['error' => 'Log file not found at ' . $logPath], 404);
        }

        // Read last 200 lines
        $file = new \SplFileObject($logPath, 'r');
        $file->seek(PHP_INT_MAX);
        $lastLine = $file->key();
        
        $start = max(0, $lastLine - 200);
        $lines = [];
        
        $file->seek($start);
        while (!$file->eof()) {
            $lines[] = $file->fgets();
        }

        return response()->json([
            'file' => $logPath,
            'total_lines' => $lastLine,
            'lines' => array_values(array_filter($lines))
        ]);
    }
}
