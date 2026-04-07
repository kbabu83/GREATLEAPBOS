<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollPolicy extends Model
{
    protected $fillable = [
        'tenant_id', 'name', 'is_default',
        'attendance_cycle_type', 'attendance_cycle_start_day',
        'payroll_cycle_type', 'payroll_cycle_start_day',
        'payment_frequency', 'payment_day',
        'working_days_basis', 'lop_applicable', 'lop_deduction_basis',
        'block_on_missing_attendance', 'block_on_missing_pan',
        'block_on_missing_bank_details', 'block_on_missing_uan',
        'include_arrears', 'is_active',
    ];

    protected $casts = [
        'is_default'                    => 'boolean',
        'lop_applicable'                => 'boolean',
        'block_on_missing_attendance'   => 'boolean',
        'block_on_missing_pan'          => 'boolean',
        'block_on_missing_bank_details' => 'boolean',
        'block_on_missing_uan'          => 'boolean',
        'include_arrears'               => 'boolean',
        'is_active'                     => 'boolean',
    ];

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Calculate the attendance period dates for a given payroll month.
     * e.g. custom cycle starting on 25 → period is 25th prev to 24th current
     */
    public function getAttendancePeriod(\DateTime $payrollMonth): array
    {
        if ($this->attendance_cycle_type === 'calendar_month') {
            return [
                'from' => $payrollMonth->format('Y-m-01'),
                'to'   => $payrollMonth->format('Y-m-t'),
            ];
        }

        $startDay = $this->attendance_cycle_start_day;
        $year     = (int) $payrollMonth->format('Y');
        $month    = (int) $payrollMonth->format('m');

        // e.g. start=25 → from: prev month 25th, to: this month 24th
        $fromMonth = $month === 1 ? 12 : $month - 1;
        $fromYear  = $month === 1 ? $year - 1 : $year;

        return [
            'from' => sprintf('%04d-%02d-%02d', $fromYear, $fromMonth, $startDay),
            'to'   => sprintf('%04d-%02d-%02d', $year, $month, $startDay - 1),
        ];
    }
}
