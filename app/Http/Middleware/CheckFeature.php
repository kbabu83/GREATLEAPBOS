<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeature
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$features): Response
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json([
                'error' => 'Unauthenticated',
            ], 401);
        }

        // Check if user has at least one of the required features
        $hasFeature = false;
        foreach ($features as $featureSlug) {
            if ($user->hasFeature($featureSlug)) {
                $hasFeature = true;
                break;
            }
        }

        if (!$hasFeature) {
            $featureList = implode(', ', $features);
            return response()->json([
                'error' => "This feature is not available in your plan",
                'required_features' => $features,
                'message' => "You need one of these features: {$featureList}",
            ], 403);
        }

        return $next($request);
    }
}
