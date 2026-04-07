<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeLeaveBalance extends Model
{
    protected $fillable = [
        'tenant_id', 'employee_id', 'leave_type_id', 'year',
        'opening_balance', 'accrued', 'carry_forward', 'additional_granted',
        'availed', 'pending', 'encashed', 'lapsed', 'available_balance',
        'last_accrual_date', 'carry_forward_expires_on',
    ];

    protected $casts = [
        'opening_balance'         => 'decimal:2',
        'accrued'                 => 'decimal:2',
        'carry_forward'           => 'decimal:2',
        'additional_granted'      => 'decimal:2',
        'availed'                 => 'decimal:2',
        'pending'                 => 'decimal:2',
        'encashed'                => 'decimal:2',
        'lapsed'                  => 'decimal:2',
        'available_balance'       => 'decimal:2',
        'last_accrual_date'       => 'date',
        'carry_forward_expires_on'=> 'date',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    // ── Computed ──────────────────────────────────────────────────────────────

    /** Total credited = opening + accrued + carry_forward + additional */
    public function getTotalCreditedAttribute(): float
    {
        return (float) $this->opening_balance
             + (float) $this->accrued
             + (float) $this->carry_forward
             + (float) $this->additional_granted;
    }

    /** Total consumed = availed + pending + encashed + lapsed */
    public function getTotalConsumedAttribute(): float
    {
        return (float) $this->availed
             + (float) $this->pending
             + (float) $this->encashed
             + (float) $this->lapsed;
    }

    /**
     * Recalculate and persist available_balance.
     * Call this after any balance-affecting event.
     */
    public function recalculate(): void
    {
        $this->available_balance = max(0, $this->total_credited - (float) $this->availed - (float) $this->pending - (float) $this->encashed);
        $this->save();
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForYear($query, int $year)
    {
        return $query->where('year', $year);
    }

    public function scopeForEmployee($query, int $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }
}
