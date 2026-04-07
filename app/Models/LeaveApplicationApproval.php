<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveApplicationApproval extends Model
{
    protected $fillable = [
        'leave_application_id', 'level', 'approver_type',
        'assigned_to_employee_id', 'actioned_by_employee_id',
        'status', 'comments', 'actioned_at',
    ];

    protected $casts = [
        'actioned_at' => 'datetime',
        'level'       => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function leaveApplication(): BelongsTo
    {
        return $this->belongsTo(LeaveApplication::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_to_employee_id');
    }

    public function actionedBy(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'actioned_by_employee_id');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isPending(): bool  { return $this->status === 'pending'; }
    public function isApproved(): bool { return in_array($this->status, ['approved', 'auto_approved']); }
    public function isRejected(): bool { return $this->status === 'rejected'; }
}
