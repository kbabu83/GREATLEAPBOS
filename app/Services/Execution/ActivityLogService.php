<?php
namespace App\Services\Execution;
use App\Models\Execution\EsActivityLog;

class ActivityLogService {
    public function log(string $tenantId, int $userId, string $actionType, string $entityType, int $entityId, array $metadata = []): void {
        EsActivityLog::create([
            'tenant_id'   => $tenantId,
            'user_id'     => $userId,
            'action_type' => $actionType,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'metadata'    => $metadata ?: null,
        ]);
    }

    public function forEntity(string $entityType, int $entityId, string $tenantId, int $limit = 50): \Illuminate\Database\Eloquent\Collection {
        return EsActivityLog::where('tenant_id', $tenantId)
            ->where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->with('user:id,name')
            ->latest()
            ->limit($limit)
            ->get();
    }
}
