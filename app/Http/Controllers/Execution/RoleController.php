<?php
namespace App\Http\Controllers\Execution;

use App\Http\Controllers\Controller;
use App\Models\Execution\EsRole;
use App\Models\Execution\EsRoleArea;
use App\Models\Execution\EsRoleActivity;
use App\Services\Execution\RoleService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller {
    public function __construct(private RoleService $service) {}

    // ── Role CRUD ─────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse {
        $tenantId = auth()->user()->tenant_id;
        $roles = $this->service->list($tenantId, (bool)$request->active_only);
        return response()->json($roles);
    }

    public function store(Request $request): JsonResponse {
        $this->requireAdmin();
        $data = $request->validate([
            'name'                                       => 'required|string|max:255',
            'purpose'                                    => 'nullable|string',
            'reporting_role_id'                          => 'nullable|integer|exists:es_roles,id',
            'is_active'                                  => 'boolean',
            'areas'                                      => 'nullable|array',
            'areas.*.area_name'                          => 'required_with:areas|string|max:255',
            'areas.*.description'                        => 'nullable|string',
            'areas.*.parameters'                         => 'nullable|array',
            'areas.*.parameters.*.parameter_name'        => 'required_with:areas.*.parameters|string|max:255',
            'areas.*.parameters.*.description'           => 'nullable|string',
            'activities'                                 => 'nullable|array',
            'activities.*.activity_name'                 => 'required_with:activities|string|max:255',
            'activities.*.description'                   => 'nullable|string',
            'activities.*.area_id'                       => 'nullable',
            'activities.*.frequency_type'                => 'nullable|in:daily,weekly,monthly,quarterly,yearly',
            'activities.*.frequency_value'               => 'nullable|string|max:100',
            'skills.hard_skills'                         => 'nullable|array',
            'skills.soft_skills'                         => 'nullable|array',
            'ideal_profile.education'                    => 'nullable|string',
            'ideal_profile.experience_range'             => 'nullable|string|max:100',
            'ideal_profile.additional_requirements'      => 'nullable|string',
            'performance_definition.excellent_definition'=> 'nullable|string',
            'performance_definition.average_definition'  => 'nullable|string',
            'performance_definition.poor_definition'     => 'nullable|string',
        ]);

        $role = $this->service->create(auth()->user()->tenant_id, auth()->id(), $data);
        return response()->json($role, 201);
    }

    public function show(EsRole $esRole): JsonResponse {
        $this->authorizeRole($esRole);
        $role = $this->service->show($esRole->id, auth()->user()->tenant_id);
        return response()->json($role);
    }

    public function update(Request $request, EsRole $esRole): JsonResponse {
        $this->requireAdmin();
        $this->authorizeRole($esRole);
        $data = $request->validate([
            'name'                                        => 'sometimes|string|max:255',
            'purpose'                                     => 'nullable|string',
            'reporting_role_id'                           => 'nullable|integer|exists:es_roles,id',
            'is_active'                                   => 'boolean',
            'areas'                                       => 'nullable|array',
            'areas.*.id'                                  => 'nullable|integer',
            'areas.*.area_name'                           => 'required_with:areas|string|max:255',
            'areas.*.description'                         => 'nullable|string',
            'areas.*.parameters'                          => 'nullable|array',
            'areas.*.parameters.*.id'                     => 'nullable|integer',
            'areas.*.parameters.*.parameter_name'         => 'required_with:areas.*.parameters|string',
            'areas.*.parameters.*.description'            => 'nullable|string',
            'activities'                                  => 'nullable|array',
            'activities.*.id'                             => 'nullable|integer',
            'activities.*.activity_name'                  => 'required_with:activities|string',
            'activities.*.description'                    => 'nullable|string',
            'activities.*.area_id'                        => 'nullable|integer',
            'activities.*.frequency_type'                 => 'nullable|in:daily,weekly,monthly,quarterly,yearly',
            'activities.*.frequency_value'                => 'nullable|string|max:100',
            'skills.hard_skills'                          => 'nullable|array',
            'skills.soft_skills'                          => 'nullable|array',
            'ideal_profile.education'                     => 'nullable|string',
            'ideal_profile.experience_range'              => 'nullable|string|max:100',
            'ideal_profile.additional_requirements'       => 'nullable|string',
            'performance_definition.excellent_definition' => 'nullable|string',
            'performance_definition.average_definition'   => 'nullable|string',
            'performance_definition.poor_definition'      => 'nullable|string',
        ]);

        $role = $this->service->update($esRole, auth()->id(), $data);
        return response()->json($role);
    }

    public function destroy(EsRole $esRole): JsonResponse {
        $this->requireAdmin();
        $this->authorizeRole($esRole);
        $this->service->delete($esRole);
        return response()->json(null, 204);
    }

    // ── Individual Area CRUD ──────────────────────────────────────────────────

    public function storeArea(Request $request, EsRole $esRole): JsonResponse {
        $this->requireAdmin();
        $this->authorizeRole($esRole);
        $data = $request->validate([
            'area_name'                        => 'required|string|max:255',
            'description'                      => 'nullable|string',
            'parameters'                       => 'nullable|array',
            'parameters.*.parameter_name'      => 'required_with:parameters|string|max:255',
            'parameters.*.description'         => 'nullable|string',
        ]);

        $area = $this->service->createArea($esRole, $data);
        return response()->json($area, 201);
    }

    public function updateArea(Request $request, EsRole $esRole, EsRoleArea $area): JsonResponse {
        $this->requireAdmin();
        $this->authorizeRole($esRole);
        $this->authorizeArea($area, $esRole);

        $data = $request->validate([
            'area_name'                        => 'required|string|max:255',
            'description'                      => 'nullable|string',
            'parameters'                       => 'nullable|array',
            'parameters.*.id'                  => 'nullable|integer',
            'parameters.*.parameter_name'      => 'required_with:parameters|string|max:255',
            'parameters.*.description'         => 'nullable|string',
        ]);

        $updated = $this->service->updateArea($area, $esRole, $data);
        return response()->json($updated);
    }

    public function destroyArea(EsRole $esRole, EsRoleArea $area): JsonResponse {
        $this->requireAdmin();
        $this->authorizeRole($esRole);
        $this->authorizeArea($area, $esRole);
        $this->service->deleteArea($area);
        return response()->json(null, 204);
    }

    // ── Individual Activity CRUD ──────────────────────────────────────────────

    public function storeActivity(Request $request, EsRole $esRole): JsonResponse {
        $this->requireAdmin();
        $this->authorizeRole($esRole);
        $data = $request->validate([
            'activity_name'   => 'required|string|max:255',
            'description'     => 'nullable|string',
            'area_id'         => 'nullable|integer|exists:es_role_areas,id',
            'frequency_type'  => 'nullable|in:daily,weekly,monthly,quarterly,yearly',
            'frequency_value' => 'nullable|string|max:100',
            'is_active'       => 'boolean',
        ]);

        $activity = $this->service->createActivity($esRole, $data);
        return response()->json($activity, 201);
    }

    public function updateActivity(Request $request, EsRole $esRole, EsRoleActivity $activity): JsonResponse {
        $this->requireAdmin();
        $this->authorizeRole($esRole);
        $this->authorizeActivity($activity, $esRole);

        $data = $request->validate([
            'activity_name'   => 'required|string|max:255',
            'description'     => 'nullable|string',
            'area_id'         => 'nullable|integer|exists:es_role_areas,id',
            'frequency_type'  => 'nullable|in:daily,weekly,monthly,quarterly,yearly',
            'frequency_value' => 'nullable|string|max:100',
            'is_active'       => 'boolean',
        ]);

        $updated = $this->service->updateActivity($activity, $data);
        return response()->json($updated);
    }

    public function destroyActivity(EsRole $esRole, EsRoleActivity $activity): JsonResponse {
        $this->requireAdmin();
        $this->authorizeRole($esRole);
        $this->authorizeActivity($activity, $esRole);
        $this->service->deleteActivity($activity);
        return response()->json(null, 204);
    }

    // ── Guards ────────────────────────────────────────────────────────────────

    private function requireAdmin(): void {
        abort_if(auth()->user()->isStaff(), 403, 'Insufficient permissions.');
    }

    private function authorizeRole(EsRole $role): void {
        abort_if($role->tenant_id !== auth()->user()->tenant_id, 403, 'Access denied');
    }

    private function authorizeArea(EsRoleArea $area, EsRole $role): void {
        abort_if($area->role_id !== $role->id, 403, 'Area does not belong to this role');
    }

    private function authorizeActivity(EsRoleActivity $activity, EsRole $role): void {
        abort_if($activity->role_id !== $role->id, 403, 'Activity does not belong to this role');
    }
}
