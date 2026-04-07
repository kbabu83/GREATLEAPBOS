<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeavePolicy extends Model
{
    protected $fillable = [
        'tenant_id', 'name', 'description', 'is_default',
        'allow_negative_balance', 'year_start_month', 'carry_forward_process_month',
        'applicable_employment_types', 'applicable_department_ids',
        'applicable_branch_ids', 'excluded_employee_ids', 'is_active',
    ];

    protected $casts = [
        'is_default'                    => 'boolean',
        'allow_negative_balance'        => 'boolean',
        'is_active'                     => 'boolean',
        'applicable_employment_types'   => 'array',
        'applicable_department_ids'     => 'array',
        'applicable_branch_ids'         => 'array',
        'excluded_employee_ids'         => 'array',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function leaveTypes(): HasMany
    {
        return $this->hasMany(LeaveType::class)->orderBy('display_order')->orderBy('name');
    }

    public function activeLeaveTypes(): HasMany
    {
        return $this->hasMany(LeaveType::class)->where('is_active', true)->orderBy('display_order');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
