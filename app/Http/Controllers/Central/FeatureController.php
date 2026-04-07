<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Feature;
use App\Models\Central\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FeatureController extends Controller
{
    /**
     * List all features
     */
    public function index(Request $request)
    {
        $query = Feature::query();

        // Filter by module
        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter active only
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $features = $query->orderBy('module')->orderBy('category')->orderBy('name')->paginate(50);

        return response()->json($features);
    }

    /**
     * Create a new feature
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:features,name',
            'slug' => 'required|string|max:100|unique:features,slug',
            'description' => 'nullable|string',
            'module' => 'required|string|max:100',
            'category' => 'nullable|string|max:100',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $feature = Feature::create([
            'id' => Str::uuid(),
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'],
            'module' => $validated['module'],
            'category' => $validated['category'],
            'icon' => $validated['icon'],
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Feature created successfully.',
            'feature' => $feature,
        ], 201);
    }

    /**
     * Get feature details
     */
    public function show(Feature $feature)
    {
        return response()->json([
            'feature' => $feature->load('plans'),
        ]);
    }

    /**
     * Update feature
     */
    public function update(Request $request, Feature $feature)
    {
        $validated = $request->validate([
            'name' => 'string|max:255|unique:features,name,' . $feature->id . ',id',
            'slug' => 'string|max:100|unique:features,slug,' . $feature->id . ',id',
            'description' => 'nullable|string',
            'module' => 'string|max:100',
            'category' => 'nullable|string|max:100',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $feature->update($validated);

        return response()->json([
            'message' => 'Feature updated successfully.',
            'feature' => $feature,
        ]);
    }

    /**
     * Delete feature
     */
    public function destroy(Feature $feature)
    {
        $feature->delete();

        return response()->json([
            'message' => 'Feature deleted successfully.',
        ]);
    }

    /**
     * Get features by module
     */
    public function byModule(Request $request, $module)
    {
        $features = Feature::where('module', $module)
            ->when($request->boolean('active_only'), function ($q) {
                $q->where('is_active', true);
            })
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return response()->json([
            'module' => $module,
            'features' => $features,
        ]);
    }

    /**
     * Get current user's available features (based on their subscription)
     */
    public function userFeatures(Request $request)
    {
        $user = auth()->user();

        // Get user's subscription
        $subscription = \App\Models\Tenant\Subscription::where('tenant_id', $user->tenant_id)
            ->where('status', 'active')
            ->first();

        if (!$subscription) {
            return response()->json(['features' => []]);
        }

        // Get plan's features
        $features = $subscription->plan->features()->where('is_active', true)->get();

        return response()->json([
            'features' => $features,
            'plan' => $subscription->plan,
        ]);
    }

    /**
     * Get tenant's subscription features
     */
    public function tenantFeatures(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $subscription = \App\Models\Tenant\Subscription::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->with('plan.features')
            ->first();

        if (!$subscription) {
            return response()->json([
                'message' => 'No active subscription found.',
                'features' => [],
            ]);
        }

        return response()->json([
            'subscription' => $subscription,
            'plan' => $subscription->plan,
            'features' => $subscription->plan->features,
        ]);
    }
}
