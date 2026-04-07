<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendancePolicy extends Model
{
    protected $fillable = [
        'tenant_id', 'name', 'is_default',
        'work_hours_per_day', 'work_days_per_week',
        'work_start_time', 'work_end_time', 'grace_period_minutes',
        'half_day_hours', 'overtime_applicable', 'overtime_rate_multiplier',
        'late_deduction_applicable', 'late_deduction_type', 'late_deduction_after_minutes',
        'cycle_type', 'cycle_start_day', 'week_off_days',
        'min_hours_for_present', 'min_hours_for_half_day', 'is_active',
    ];

    protected $casts = [
        'is_default'                  => 'boolean',
        'overtime_applicable'         => 'boolean',
        'late_deduction_applicable'   => 'boolean',
        'is_active'                   => 'boolean',
        'week_off_days'               => 'array',
        'work_hours_per_day'          => 'decimal:2',
        'half_day_hours'              => 'decimal:2',
        'min_hours_for_present'       => 'decimal:2',
        'min_hours_for_half_day'      => 'decimal:2',
        'overtime_rate_multiplier'    => 'decimal:2',
    ];

    protected static function booted(): void
    {
        // When setting a new default, un-default all others in the same tenant
        static::saving(function (self $policy) {
            if ($policy->is_default && $policy->isDirty('is_default')) {
                static::where('tenant_id', $policy->tenant_id)
                      ->where('id', '!=', $policy->id ?? 0)
                      ->update(['is_default' => false]);
            }
        });
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
