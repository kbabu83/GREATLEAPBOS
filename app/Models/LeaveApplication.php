<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveApplication extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id', 'application_number', 'employee_id', 'leave_type_id',
        'from_date', 'to_date', 'total_days', 'is_half_day', 'half_day_session',
        'reason', 'contact_during_leave', 'document_path', 'document_original_name',
        'status', 'current_approval_level', 'total_approval_levels',
        'cancellation_reason', 'cancelled_by_employee_id',
        'is_admin_granted', 'applied_by_user_id',
        'submitted_at', 'approved_at', 'rejected_at', 'auto_approve_at',
    ];

    protected $casts = [
        'from_date'              => 'date',
        'to_date'                => 'date',
        'submitted_at'           => 'datetime',
        'approved_at'            => 'datetime',
        'rejected_at'            => 'datetime',
        'auto_approve_at'        => 'datetime',
        'is_half_day'            => 'boolean',
        'is_admin_granted'       => 'boolean',
        'total_days'             => 'decimal:2',
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

    public function approvals(): HasMany
    {
        return $this->hasMany(LeaveApplicationApproval::class)->orderBy('level');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'cancelled_by_employee_id');
    }

    public function appliedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applied_by_user_id');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->whereIn('status', ['approved', 'auto_approved']);
    }

    // ── Status Helpers ────────────────────────────────────────────────────────

    public function isPending(): bool   { return $this->status === 'pending'; }
    public function isApproved(): bool  { return in_array($this->status, ['approved', 'auto_approved']); }
    public function isRejected(): bool  { return $this->status === 'rejected'; }
    public function isCancellable(): bool { return in_array($this->status, ['draft', 'pending']); }
    public function isWithdrawable(): bool { return $this->isApproved(); }

    /**
     * Generate a sequential application number like LA-2025-0001
     */
    public static function generateNumber(string $tenantId): string
    {
        $year  = date('Y');
        $count = static::where('tenant_id', $tenantId)
                        ->whereYear('created_at', $year)
                        ->withTrashed()
                        ->count() + 1;
        return "LA-{$year}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
