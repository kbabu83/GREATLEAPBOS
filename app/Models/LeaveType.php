<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    protected $fillable = [
        'tenant_id', 'leave_policy_id',
        // Identity
        'name', 'code', 'color', 'icon', 'description', 'display_order',
        // Paid
        'is_paid',
        // Entitlement & Accrual
        'days_per_year', 'accrual_type', 'accrual_per_period',
        'credit_during_probation', 'credit_on_loss_of_pay_days',
        'prorate_on_joining', 'prorate_basis', 'prorate_on_exit',
        // Per-Application Limits
        'min_days_per_application', 'max_days_per_application', 'max_consecutive_days',
        // Period Limits
        'max_days_per_month', 'max_days_per_quarter',
        // Half Day
        'allow_half_day',
        // Application Window
        'advance_notice_days', 'allow_backdated_application', 'max_backdated_days',
        // Document
        'requires_document', 'document_required_after_days',
        // Sandwich Rule
        'include_holidays_in_count', 'include_weekends_in_count',
        // Carry Forward
        'carry_forward', 'max_carry_forward_days', 'carry_forward_expires',
        'carry_forward_expiry_months',
        // Encashment
        'encashable', 'max_encashment_days_per_year', 'min_balance_after_encashment',
        'encashment_on_exit',
        // Eligibility
        'gender_restriction', 'employment_type_restriction', 'applicable_after_days',
        'applicable_during_probation', 'department_restriction', 'branch_restriction',
        'designation_restriction', 'excluded_employee_ids',
        // Approval
        'approval_levels', 'auto_approve', 'auto_approve_after_hours',
        'notify_hr_on_apply', 'notify_team_on_approval',
        // Admin
        'is_admin_only', 'is_active',
    ];

    protected $casts = [
        'is_paid'                        => 'boolean',
        'credit_during_probation'        => 'boolean',
        'credit_on_loss_of_pay_days'     => 'boolean',
        'prorate_on_joining'             => 'boolean',
        'prorate_on_exit'                => 'boolean',
        'allow_half_day'                 => 'boolean',
        'allow_backdated_application'    => 'boolean',
        'requires_document'              => 'boolean',
        'include_holidays_in_count'      => 'boolean',
        'include_weekends_in_count'      => 'boolean',
        'carry_forward'                  => 'boolean',
        'carry_forward_expires'          => 'boolean',
        'encashable'                     => 'boolean',
        'encashment_on_exit'             => 'boolean',
        'applicable_during_probation'    => 'boolean',
        'auto_approve'                   => 'boolean',
        'notify_hr_on_apply'             => 'boolean',
        'notify_team_on_approval'        => 'boolean',
        'is_admin_only'                  => 'boolean',
        'is_active'                      => 'boolean',

        // JSON eligibility arrays
        'employment_type_restriction'    => 'array',
        'department_restriction'         => 'array',
        'branch_restriction'             => 'array',
        'designation_restriction'        => 'array',
        'excluded_employee_ids'          => 'array',

        // Decimals
        'days_per_year'                  => 'decimal:2',
        'accrual_per_period'             => 'decimal:3',
        'min_days_per_application'       => 'decimal:2',
        'max_days_per_application'       => 'decimal:2',
        'max_consecutive_days'           => 'decimal:2',
        'max_days_per_month'             => 'decimal:2',
        'max_days_per_quarter'           => 'decimal:2',
        'max_carry_forward_days'         => 'decimal:2',
        'max_encashment_days_per_year'   => 'decimal:2',
        'min_balance_after_encashment'   => 'decimal:2',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function leavePolicy(): BelongsTo
    {
        return $this->belongsTo(LeavePolicy::class);
    }

    public function approvalLevels(): HasMany
    {
        return $this->hasMany(LeaveTypeApprovalLevel::class)->orderBy('level');
    }

    public function leaveApplications(): HasMany
    {
        return $this->hasMany(LeaveApplication::class);
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(EmployeeLeaveBalance::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Business Logic ────────────────────────────────────────────────────────

    /**
     * Check if a given employee is eligible for this leave type.
     */
    public function isEligibleFor(Employee $employee): bool
    {
        // Gender
        if ($this->gender_restriction !== 'none' && $this->gender_restriction !== $employee->gender) {
            return false;
        }

        // Employment type
        if (!empty($this->employment_type_restriction) &&
            !in_array($employee->employment_type, $this->employment_type_restriction)) {
            return false;
        }

        // Min service days
        if ($this->applicable_after_days > 0 && $employee->date_of_joining) {
            $serviceDays = $employee->date_of_joining->diffInDays(now());
            if ($serviceDays < $this->applicable_after_days) return false;
        }

        // Probation
        if (!$this->applicable_during_probation && $employee->employment_status === 'probation') {
            return false;
        }

        // Department restriction
        if (!empty($this->department_restriction) &&
            !in_array($employee->department_id, $this->department_restriction)) {
            return false;
        }

        // Branch restriction
        if (!empty($this->branch_restriction) &&
            !in_array($employee->branch_id, $this->branch_restriction)) {
            return false;
        }

        // Designation restriction
        if (!empty($this->designation_restriction) &&
            !in_array($employee->designation_id, $this->designation_restriction)) {
            return false;
        }

        // Individual exclusions
        if (!empty($this->excluded_employee_ids) &&
            in_array($employee->id, $this->excluded_employee_ids)) {
            return false;
        }

        return true;
    }

    /**
     * Calculate prorated entitlement for a new joiner.
     */
    public function proratedDaysForEmployee(Employee $employee): float
    {
        if (!$this->prorate_on_joining || !$employee->date_of_joining) {
            return (float) $this->days_per_year;
        }

        $joiningDate = $employee->date_of_joining;
        $yearStart   = now()->startOfYear(); // adjust for financial year if needed

        if ($joiningDate->lte($yearStart)) {
            return (float) $this->days_per_year;
        }

        if ($this->prorate_basis === 'months_completed') {
            $monthsRemaining = $joiningDate->diffInMonths(now()->endOfYear()) + 1;
            return round($this->days_per_year / 12 * min($monthsRemaining, 12), 2);
        }

        // calendar_days basis
        $daysInYear      = now()->isLeapYear() ? 366 : 365;
        $daysRemaining   = $joiningDate->diffInDays(now()->endOfYear()) + 1;
        return round($this->days_per_year / $daysInYear * $daysRemaining, 2);
    }
}
