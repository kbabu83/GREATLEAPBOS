<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\OrganisationSetting;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganisationController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $setting  = OrganisationSetting::where('tenant_id', $tenantId)->first();
        $tenant   = Tenant::find($tenantId);

        return response()->json([
            'organisation' => $setting,
            'tenant'       => [
                'id'     => $tenant->id,
                'name'   => $tenant->name,
                'plan'   => $tenant->plan,
                'status' => $tenant->status,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            // Identity
            'legal_name'                  => 'nullable|string|max:255',
            'trade_name'                  => 'nullable|string|max:255',
            'tagline'                     => 'nullable|string|max:500',
            'about'                       => 'nullable|string',
            'industry'                    => 'nullable|string|max:100',
            'company_size'                => 'nullable|in:micro,small,medium,large',
            'registration_number'         => 'nullable|string|max:100',
            'gst_number'                  => 'nullable|string|max:20',
            'pan_number'                  => 'nullable|string|max:15',

            // Contact
            'phone'                       => 'nullable|string|max:20',
            'email'                       => 'nullable|email',
            'website'                     => 'nullable|url',

            // Address
            'address_line1'               => 'nullable|string|max:255',
            'address_line2'               => 'nullable|string|max:255',
            'city'                        => 'nullable|string|max:100',
            'state'                       => 'nullable|string|max:100',
            'country'                     => 'nullable|string|max:100',
            'pincode'                     => 'nullable|string|max:10',

            // System
            'financial_year_start_month'  => 'nullable|integer|min:1|max:12',
            'timezone'                    => 'nullable|string|max:50',
            'currency'                    => 'nullable|string|max:3',
            'date_format'                 => 'nullable|string|max:20',
            'employee_id_prefix'          => 'nullable|string|max:10',

            // Culture
            'vision'                      => 'nullable|string',
            'mission'                     => 'nullable|string',
            'core_values'                 => 'nullable|array',
            'core_values.*.title'         => 'required_with:core_values|string|max:255',
            'core_values.*.description'   => 'nullable|string',

            // Business
            'products'                    => 'nullable|array',
            'products.*.name'             => 'required_with:products|string|max:255',
            'products.*.description'      => 'nullable|string',
            'products.*.category'         => 'nullable|string|max:100',
            'services'                    => 'nullable|array',
            'services.*.name'             => 'required_with:services|string|max:255',
            'services.*.description'      => 'nullable|string',
            'major_clients'               => 'nullable|array',
            'major_clients.*.name'        => 'required_with:major_clients|string|max:255',
            'major_clients.*.industry'    => 'nullable|string|max:100',
            'major_clients.*.note'        => 'nullable|string',

            // Standards & Goals
            'quality_policy'              => 'nullable|string',
            'company_goals'               => 'nullable|array',
            'company_goals.*.goal'        => 'required_with:company_goals|string|max:500',
            'company_goals.*.target'      => 'nullable|string|max:255',
            'company_goals.*.timeframe'   => 'nullable|string|max:100',
            'key_processes'               => 'nullable|array',
            'key_processes.*.title'       => 'required_with:key_processes|string|max:255',
            'key_processes.*.description' => 'nullable|string',
        ]);

        $setting = OrganisationSetting::updateOrCreate(
            ['tenant_id' => $tenantId],
            $validated
        );

        return response()->json([
            'message'      => 'Company profile saved.',
            'organisation' => $setting,
        ]);
    }
}
