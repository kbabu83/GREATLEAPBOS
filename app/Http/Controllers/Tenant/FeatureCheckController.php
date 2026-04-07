<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Services\FeatureService;
use Illuminate\Http\Request;

class FeatureCheckController extends Controller
{
    /**
     * Get all features for the current user
     */
    public function getUserFeatures(Request $request)
    {
        $user = auth()->user();
        $features = FeatureService::getUserFeatures($user);

        return response()->json([
            'features' => $features,
            'count' => count($features),
        ]);
    }

    /**
     * Check if user has a specific feature
     */
    public function checkFeature(Request $request, $featureSlug)
    {
        $user = auth()->user();
        $hasFeature = FeatureService::userHasFeature($user, $featureSlug);

        return response()->json([
            'has_feature' => $hasFeature,
            'feature' => $featureSlug,
            'user_plan' => $user->tenant?->subscription?->plan?->name,
        ]);
    }

    /**
     * Check if user has any of the given features
     */
    public function checkAnyFeature(Request $request)
    {
        $request->validate([
            'features' => 'required|array|min:1',
            'features.*' => 'string',
        ]);

        $user = auth()->user();
        $features = $request->input('features');
        $hasAny = FeatureService::userHasAnyFeature($user, $features);

        return response()->json([
            'has_any' => $hasAny,
            'requested_features' => $features,
            'user_features' => FeatureService::getUserFeatures($user),
        ]);
    }

    /**
     * Get feature details
     */
    public function getFeatureDetails($featureSlug)
    {
        $feature = FeatureService::getFeatureBySlug($featureSlug);

        if (!$feature) {
            return response()->json([
                'error' => 'Feature not found',
            ], 404);
        }

        return response()->json([
            'feature' => $feature,
        ]);
    }

    /**
     * Get all available features
     */
    public function getAllFeatures()
    {
        $features = FeatureService::getAllFeatures();

        return response()->json([
            'features' => $features,
            'total' => count($features),
        ]);
    }
}
