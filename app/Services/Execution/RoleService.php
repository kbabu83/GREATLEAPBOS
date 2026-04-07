<?php
namespace App\Services\Execution;

use App\Models\Execution\EsRole;
use App\Models\Execution\EsRoleArea;
use App\Models\Execution\EsRoleActivity;
use App\Repositories\Execution\RoleRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RoleService {
    public function __construct(
        private RoleRepository $repo,
        private ActivityLogService $logger,
    ) {}

    public function list(string $tenantId, bool $activeOnly = false): Collection {
        return $this->repo->allForTenant($tenantId, $activeOnly);
    }

    public function show(int $id, string $tenantId): ?EsRole {
        return $this->repo->findWithFull($id, $tenantId);
    }

    public function create(string $tenantId, int $userId, array $data): EsRole {
        return DB::transaction(function () use ($tenantId, $userId, $data) {
            $role = $this->repo->create($tenantId, [
                'name'              => $data['name'],
                'purpose'           => $data['purpose'] ?? null,
                'reporting_role_id' => $data['reporting_role_id'] ?? null,
                'is_active'         => $data['is_active'] ?? true,
            ]);

            $areaIndexMap = [];
            if (!empty($data['areas'])) {
                $areaIndexMap = $this->repo->syncAreas($role, $data['areas']);
            }
            if (!empty($data['activities'])) {
                $this->repo->syncActivities($role, $data['activities'], $areaIndexMap);
            }
            if (!empty($data['skills'])) $this->repo->upsertSkills($role, $data['skills']);
            if (!empty($data['ideal_profile'])) $this->repo->upsertIdealProfile($role, $data['ideal_profile']);
            if (!empty($data['performance_definition'])) $this->repo->upsertPerformanceDefinition($role, $data['performance_definition']);

            $this->logger->log($tenantId, $userId, 'role_created', 'role', $role->id, ['name' => $role->name]);
            return $this->repo->findWithFull($role->id, $tenantId);
        });
    }

    public function update(EsRole $role, int $userId, array $data): EsRole {
        return DB::transaction(function () use ($role, $userId, $data) {
            // Build update payload — only include keys explicitly provided in $data
            // so that null values (e.g. clearing reporting_role_id) are preserved.
            $updateData = [];
            foreach (['name', 'purpose', 'reporting_role_id', 'is_active'] as $field) {
                if (array_key_exists($field, $data)) {
                    $updateData[$field] = $data[$field];
                }
            }
            if (!empty($updateData)) {
                $this->repo->update($role, $updateData);
            }

            $areaIndexMap = [];
            if (array_key_exists('areas', $data)) {
                $areaIndexMap = $this->repo->syncAreas($role, $data['areas'] ?? []);
            }
            if (array_key_exists('activities', $data)) {
                $this->repo->syncActivities($role, $data['activities'] ?? [], $areaIndexMap);
            }
            if (!empty($data['skills'])) $this->repo->upsertSkills($role, $data['skills']);
            if (!empty($data['ideal_profile'])) $this->repo->upsertIdealProfile($role, $data['ideal_profile']);
            if (!empty($data['performance_definition'])) $this->repo->upsertPerformanceDefinition($role, $data['performance_definition']);

            $this->logger->log($role->tenant_id, $userId, 'role_updated', 'role', $role->id, ['name' => $role->name]);
            return $this->repo->findWithFull($role->id, $role->tenant_id);
        });
    }

    public function delete(EsRole $role): void { $this->repo->delete($role); }

    // ── Individual Area CRUD ──────────────────────────────────────────────────

    public function createArea(EsRole $role, array $data): EsRoleArea {
        return $this->repo->createArea($role, $data);
    }

    public function updateArea(EsRoleArea $area, EsRole $role, array $data): EsRoleArea {
        return $this->repo->updateArea($area, $role, $data);
    }

    public function deleteArea(EsRoleArea $area): void {
        $this->repo->deleteArea($area);
    }

    // ── Individual Activity CRUD ──────────────────────────────────────────────

    public function createActivity(EsRole $role, array $data): EsRoleActivity {
        return $this->repo->createActivity($role, $data);
    }

    public function updateActivity(EsRoleActivity $activity, array $data): EsRoleActivity {
        return $this->repo->updateActivity($activity, $data);
    }

    public function deleteActivity(EsRoleActivity $activity): void {
        $this->repo->deleteActivity($activity);
    }
}
