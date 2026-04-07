<?php

namespace App\Services;

use App\Models\Tenant\User;
use Illuminate\Support\Facades\Cache;

class FeatureService
{
    /**
     * Check if a user has a specific feature
     */
    public static function userHasFeature(User $user, string $featureSlug): bool
    {
        if (!$user->subscription || $user->subscription->status !== 'active') {
            return false;
        }

        return $user->subscription->plan->features()
            ->where('slug', $featureSlug)
            ->exists();
    }

    /**
     * Check if user has any of the given features
     */
    public static function userHasAnyFeature(User $user, array $featureSlugs): bool
    {
        foreach ($featureSlugs as $slug) {
            if (self::userHasFeature($user, $slug)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all features for a user's plan
     */
    public static function getUserFeatures(User $user): array
    {
        if (!$user->subscription || $user->subscription->status !== 'active') {
            return [];
        }

        return $user->subscription->plan->features()
            ->pluck('slug')
            ->toArray();
    }

    /**
     * Get feature details by slug
     */
    public static function getFeatureBySlug(string $slug)
    {
        return \App\Models\Central\Feature::where('slug', $slug)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Check if a specific feature is available in the system
     */
    public static function featureExists(string $slug): bool
    {
        return \App\Models\Central\Feature::where('slug', $slug)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Get all active features, optionally cached
     */
    public static function getAllFeatures($useCache = true)
    {
        if ($useCache) {
            return Cache::remember('all_features', 3600, function () {
                return \App\Models\Central\Feature::where('is_active', true)
                    ->orderBy('category')
                    ->orderBy('name')
                    ->get();
            });
        }

        return \App\Models\Central\Feature::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get();
    }

    /**
     * Check feature and throw exception if not available
     */
    public static function requireFeature(User $user, string $featureSlug): bool
    {
        if (!self::userHasFeature($user, $featureSlug)) {
            throw new \Exception(
                "Feature '{$featureSlug}' is not available in your plan",
                403
            );
        }
        return true;
    }

    /**
     * Check if user has exceeded feature quota
     */
    public static function checkQuota(User $user, string $featureSlug, int $currentUsage, int $limit): bool
    {
        // If user doesn't have the feature, return false
        if (!self::userHasFeature($user, $featureSlug)) {
            return false;
        }

        // If feature is unlimited (limit = -1), return true
        if ($limit === -1) {
            return true;
        }

        return $currentUsage < $limit;
    }
}
