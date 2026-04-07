<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalTenants  = Tenant::count();
        $activeTenants = Tenant::where('status', Tenant::STATUS_ACTIVE)->count();
        $trialTenants  = Tenant::where('status', Tenant::STATUS_TRIAL)->count();
        $totalCentralUsers = User::count();

        // Tenants by plan
        $tenantsByPlan = Tenant::select('plan', DB::raw('count(*) as count'))
            ->groupBy('plan')
            ->get()
            ->pluck('count', 'plan')
            ->toArray();

        // Tenants by status
        $tenantsByStatus = Tenant::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Monthly tenant registrations (last 12 months)
        $monthlyRegistrations = Tenant::select(
            DB::raw('YEAR(created_at) as year'),
            DB::raw('MONTH(created_at) as month'),
            DB::raw('count(*) as count')
        )
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(fn ($item) => [
                'month' => date('M Y', mktime(0, 0, 0, $item->month, 1, $item->year)),
                'count' => $item->count,
            ]);

        // Recent tenants
        $recentTenants = Tenant::with('domains')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($tenant) => [
                'id'     => $tenant->id,
                'name'   => $tenant->name,
                'email'  => $tenant->email,
                'plan'   => $tenant->plan,
                'status' => $tenant->status,
                'domain' => $tenant->domains->first()?->domain,
                'created_at' => $tenant->created_at->toISOString(),
            ]);

        // Count total users across all tenant databases using direct SQL
        // Avoids initialising tenancy mid-request which can corrupt connection state.
        $totalTenantUsers = 0;
        $prefix = config('tenancy.database.prefix', 'tenant_');
        $tenantIds = Tenant::pluck('id');

        foreach ($tenantIds as $tenantId) {
            $dbName = $prefix . $tenantId;
            try {
                $result = DB::select("SELECT COUNT(*) as cnt FROM `{$dbName}`.`users`");
                $totalTenantUsers += $result[0]->cnt ?? 0;
            } catch (\Throwable $e) {
                // Tenant DB may not exist yet — skip silently
            }
        }

        return response()->json([
            'stats' => [
                'total_tenants'       => $totalTenants,
                'active_tenants'      => $activeTenants,
                'trial_tenants'       => $trialTenants,
                'total_central_users' => $totalCentralUsers,
                'total_tenant_users'  => $totalTenantUsers,
            ],
            'tenants_by_plan'         => $tenantsByPlan,
            'tenants_by_status'       => $tenantsByStatus,
            'monthly_registrations'   => $monthlyRegistrations,
            'recent_tenants'          => $recentTenants,
        ]);
    }
}
