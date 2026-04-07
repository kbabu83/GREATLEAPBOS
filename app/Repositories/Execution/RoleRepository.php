<?php
namespace App\Repositories\Execution;

use App\Models\Execution\EsRole;
use App\Models\Execution\EsRoleArea;
use App\Models\Execution\EsAreaParameter;
use App\Models\Execution\EsRoleActivity;
use App\Models\Execution\EsRoleSkill;
use App\Models\Execution\EsRoleIdealProfile;
use App\Models\Execution\EsRolePerformanceDefinition;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RoleRepository
{
    public function allForTenant(string $tenantId, bool $activeOnly = false): Collection
    {
        return EsRole::where('tenant_id', $tenantId)
            ->when($activeOnly, fn($q) => $q->where('is_active', true))
            ->with(['reportingRole:id,name'])
            ->orderBy('name')
            ->get();
    }

    public function findWithFull(int $id, string $tenantId): ?EsRole
    {
        return EsRole::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->with([
                'areas.parameters',
                'activities.area:id,area_name',
                'skills',
                'idealProfile',
                'performanceDefinition',
                'reportingRole:id,name',
            ])
            ->first();
    }

    public function create(string $tenantId, array $data): EsRole
    {
        return EsRole::create(array_merge($data, ['tenant_id' => $tenantId]));
    }

    public function update(EsRole $role, array $data): EsRole
    {
        $role->update($data);
        return $role->fresh();
    }

    public function delete(EsRole $role): void
    {
        $role->delete();
    }

    // ── Areas ─────────────────────────────────────────────────────────────────

    /**
     * Sync areas for a role. Returns a map of frontend_index → real area_id
     * so callers can resolve activity area references.
     *
     * @return array<int, int>  index => real area id
     */
    public function syncAreas(EsRole $role, array $areas): array
    {
        $existingIds = $role->areas()->pluck('id')->toArray();
        $kept        = [];
        $indexToId   = [];  // frontend array index → real DB area id

        foreach ($areas as $idx => $area) {
            $areaId = $area['id'] ?? null;

            if ($areaId && in_array($areaId, $existingIds)) {
                // Update existing
                EsRoleArea::find($areaId)->update([
                    'area_name'     => $area['area_name'],
                    'description'   => $area['description'] ?? null,
                    'display_order' => $idx,
                ]);
                $kept[]           = $areaId;
                $indexToId[$idx]  = $areaId;
            } else {
                // Create new
                $areaModel = EsRoleArea::create([
                    'tenant_id'     => $role->tenant_id,
                    'role_id'       => $role->id,
                    'area_name'     => $area['area_name'],
                    'description'   => $area['description'] ?? null,
                    'display_order' => $idx,
                ]);
                $kept[]           = $areaModel->id;
                $indexToId[$idx]  = $areaModel->id;
            }

            // Sync parameters — always call, even for empty arrays (clears deleted ones)
            $areaModel = EsRoleArea::find($indexToId[$idx]);
            $this->syncParameters($areaModel, $role, $area['parameters'] ?? []);
        }

        // Delete areas removed by the user
        EsRoleArea::where('role_id', $role->id)
            ->whereNotIn('id', $kept)
            ->delete();

        return $indexToId;
    }

    private function syncParameters(EsRoleArea $area, EsRole $role, array $params): void
    {
        $existingIds = $area->parameters()->pluck('id')->toArray();
        $kept        = [];

        foreach ($params as $p) {
            if (!empty($p['parameter_name'])) {
                $paramId = $p['id'] ?? null;

                if ($paramId && in_array($paramId, $existingIds)) {
                    EsAreaParameter::find($paramId)->update([
                        'parameter_name' => $p['parameter_name'],
                        'description'    => $p['description'] ?? null,
                    ]);
                    $kept[] = $paramId;
                } else {
                    $pm = EsAreaParameter::create([
                        'tenant_id'      => $role->tenant_id,
                        'area_id'        => $area->id,
                        'role_id'        => $role->id,
                        'parameter_name' => $p['parameter_name'],
                        'description'    => $p['description'] ?? null,
                    ]);
                    $kept[] = $pm->id;
                }
            }
        }

        // Delete parameters no longer in the list
        EsAreaParameter::where('area_id', $area->id)
            ->when(!empty($kept), fn($q) => $q->whereNotIn('id', $kept))
            ->delete();
    }

    // ── Activities ────────────────────────────────────────────────────────────

    /**
     * Sync activities for a role.
     *
     * @param  array<int,int>  $areaIndexMap  optional frontend-index → real area_id map
     *                                        produced by syncAreas(); used to resolve
     *                                        temporary "new_N" area references.
     */
    public function syncActivities(EsRole $role, array $activities, array $areaIndexMap = []): void
    {
        $existingIds = $role->activities()->pluck('id')->toArray();
        $kept        = [];

        foreach ($activities as $act) {
            // Resolve area_id: real integer ID straight through; anything else → null
            $rawAreaId = $act['area_id'] ?? null;
            $areaId    = null;

            if (is_numeric($rawAreaId) && (int)$rawAreaId > 0) {
                $areaId = (int) $rawAreaId;
            } elseif (is_string($rawAreaId) && str_starts_with($rawAreaId, 'new_')) {
                // Frontend sent a temporary index reference like "new_0"
                $idx    = (int) str_replace('new_', '', $rawAreaId);
                $areaId = $areaIndexMap[$idx] ?? null;
            }

            $data = [
                'tenant_id'       => $role->tenant_id,
                'role_id'         => $role->id,
                'area_id'         => $areaId,
                'activity_name'   => $act['activity_name'],
                'description'     => $act['description'] ?? null,
                'frequency_type'  => $act['frequency_type'] ?? 'daily',
                'frequency_value' => $act['frequency_value'] ?? null,
                'is_active'       => $act['is_active'] ?? true,
            ];

            $actId = $act['id'] ?? null;

            if ($actId && in_array($actId, $existingIds)) {
                EsRoleActivity::find($actId)->update($data);
                $kept[] = $actId;
            } else {
                $am     = EsRoleActivity::create($data);
                $kept[] = $am->id;
            }
        }

        EsRoleActivity::where('role_id', $role->id)
            ->when(!empty($kept), fn($q) => $q->whereNotIn('id', $kept))
            ->delete();
    }

    // ── Individual area / activity CRUD (for step-by-step wizard) ────────────

    public function createArea(EsRole $role, array $data): EsRoleArea
    {
        $area = EsRoleArea::create([
            'tenant_id'     => $role->tenant_id,
            'role_id'       => $role->id,
            'area_name'     => $data['area_name'],
            'description'   => $data['description'] ?? null,
            'display_order' => EsRoleArea::where('role_id', $role->id)->max('display_order') + 1,
        ]);

        if (!empty($data['parameters'])) {
            $this->syncParameters($area, $role, $data['parameters']);
        }

        return $area->load('parameters');
    }

    public function updateArea(EsRoleArea $area, EsRole $role, array $data): EsRoleArea
    {
        $area->update([
            'area_name'   => $data['area_name'],
            'description' => $data['description'] ?? null,
        ]);

        if (array_key_exists('parameters', $data)) {
            $this->syncParameters($area, $role, $data['parameters'] ?? []);
        }

        return $area->fresh()->load('parameters');
    }

    public function deleteArea(EsRoleArea $area): void
    {
        // Activities linked to this area get area_id set to NULL via FK nullOnDelete
        $area->delete();
    }

    public function createActivity(EsRole $role, array $data): EsRoleActivity
    {
        $areaId = is_numeric($data['area_id'] ?? null) ? (int)$data['area_id'] : null;

        return EsRoleActivity::create([
            'tenant_id'       => $role->tenant_id,
            'role_id'         => $role->id,
            'area_id'         => $areaId,
            'activity_name'   => $data['activity_name'],
            'description'     => $data['description'] ?? null,
            'frequency_type'  => $data['frequency_type'] ?? 'daily',
            'frequency_value' => $data['frequency_value'] ?? null,
            'is_active'       => $data['is_active'] ?? true,
        ]);
    }

    public function updateActivity(EsRoleActivity $activity, array $data): EsRoleActivity
    {
        $areaId = is_numeric($data['area_id'] ?? null) ? (int)$data['area_id'] : null;

        $activity->update([
            'area_id'         => $areaId,
            'activity_name'   => $data['activity_name'],
            'description'     => $data['description'] ?? null,
            'frequency_type'  => $data['frequency_type'] ?? 'daily',
            'frequency_value' => $data['frequency_value'] ?? null,
            'is_active'       => $data['is_active'] ?? true,
        ]);

        return $activity->fresh();
    }

    public function deleteActivity(EsRoleActivity $activity): void
    {
        $activity->delete();
    }

    // ── Meta ──────────────────────────────────────────────────────────────────

    public function upsertSkills(EsRole $role, array $data): void
    {
        EsRoleSkill::updateOrCreate(
            ['role_id' => $role->id],
            array_merge($data, ['tenant_id' => $role->tenant_id])
        );
    }

    public function upsertIdealProfile(EsRole $role, array $data): void
    {
        EsRoleIdealProfile::updateOrCreate(
            ['role_id' => $role->id],
            array_merge($data, ['tenant_id' => $role->tenant_id])
        );
    }

    public function upsertPerformanceDefinition(EsRole $role, array $data): void
    {
        EsRolePerformanceDefinition::updateOrCreate(
            ['role_id' => $role->id],
            array_merge($data, ['tenant_id' => $role->tenant_id])
        );
    }
}
