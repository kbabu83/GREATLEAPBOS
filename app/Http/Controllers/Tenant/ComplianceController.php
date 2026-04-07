<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ComplianceSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplianceController extends Controller
{
    /**
     * Default values returned when no compliance record exists for a tenant yet.
     */
    private const DEFAULTS = [
        'pf_applicable'                => false,
        'pf_registration_number'       => null,
        'pf_employee_rate'             => 12.00,
        'pf_employer_rate'             => 12.00,
        'pf_wage_ceiling'              => 15000.00,
        'pf_on_actual_basic'           => false,
        'esi_applicable'               => false,
        'esi_registration_number'      => null,
        'esi_employee_rate'            => 0.75,
        'esi_employer_rate'            => 3.25,
        'esi_wage_ceiling'             => 21000.00,
        'pt_applicable'                => false,
        'pt_state'                     => null,
        'pt_slabs'                     => [],
        'tds_applicable'               => false,
        'tds_regime'                   => 'new',
        'lwf_applicable'               => false,
        'lwf_employee_amount'          => null,
        'lwf_employer_amount'          => null,
        'lwf_state'                    => null,
        'gratuity_applicable'          => false,
        'gratuity_rate'                => 4.81,
    ];

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $setting = ComplianceSetting::where('tenant_id', $tenantId)->first();

        if (!$setting) {
            // Return defaults without persisting
            return response()->json([
                'compliance' => array_merge(['tenant_id' => $tenantId], self::DEFAULTS),
                'is_configured' => false,
            ]);
        }

        return response()->json([
            'compliance'    => $setting,
            'is_configured' => true,
        ]);
    }

    // ── Update (upsert) ───────────────────────────────────────────────────────

    public function update(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            // PF
            'pf_applicable'           => 'boolean',
            'pf_registration_number'  => 'nullable|string|max:30',
            'pf_employee_rate'        => 'nullable|numeric|min:0|max:100',
            'pf_employer_rate'        => 'nullable|numeric|min:0|max:100',
            'pf_wage_ceiling'         => 'nullable|numeric|min:0',
            'pf_on_actual_basic'      => 'boolean',

            // ESI
            'esi_applicable'          => 'boolean',
            'esi_registration_number' => 'nullable|string|max:30',
            'esi_employee_rate'       => 'nullable|numeric|min:0|max:100',
            'esi_employer_rate'       => 'nullable|numeric|min:0|max:100',
            'esi_wage_ceiling'        => 'nullable|numeric|min:0',

            // Professional Tax
            'pt_applicable'           => 'boolean',
            'pt_state'                => 'nullable|string|max:100',
            'pt_slabs'                => 'nullable|array',
            'pt_slabs.*.from'         => 'required_with:pt_slabs|numeric|min:0',
            'pt_slabs.*.to'           => 'nullable|numeric|min:0',
            'pt_slabs.*.amount'       => 'required_with:pt_slabs|numeric|min:0',

            // TDS
            'tds_applicable'          => 'boolean',
            'tds_regime'              => 'nullable|in:old,new',

            // LWF
            'lwf_applicable'          => 'boolean',
            'lwf_employee_amount'     => 'nullable|numeric|min:0',
            'lwf_employer_amount'     => 'nullable|numeric|min:0',
            'lwf_state'               => 'nullable|string|max:100',

            // Gratuity
            'gratuity_applicable'     => 'boolean',
            'gratuity_rate'           => 'nullable|numeric|min:0|max:100',
        ]);

        $setting = ComplianceSetting::updateOrCreate(
            ['tenant_id' => $tenantId],
            $validated
        );

        return response()->json([
            'message'    => 'Compliance settings saved successfully.',
            'compliance' => $setting->fresh(),
        ]);
    }
}
