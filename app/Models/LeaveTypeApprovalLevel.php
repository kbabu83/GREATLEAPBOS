<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveTypeApprovalLevel extends Model
{
    protected $fillable = [
        'leave_type_id', 'level', 'approver_type', 'specific_employee_id',
        'skip_if_approver_on_leave', 'notify_on_new_application', 'notify_on_cancellation',
    ];

    protected $casts = [
        'skip_if_approver_on_leave'   => 'boolean',
        'notify_on_new_application'   => 'boolean',
        'notify_on_cancellation'      => 'boolean',
        'level'                       => 'integer',
    ];

    public static array $APPROVER_TYPE_LABELS = [
        'reporting_manager'  => 'Reporting Manager',
        'department_head'    => 'Department Head',
        'hr_manager'         => 'HR Manager (Any Admin)',
        'specific_employee'  => 'Specific Employee',
    ];

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function specificEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'specific_employee_id');
    }

    /**
     * Resolve the actual employee who should approve for a given applicant.
     */
    public function resolveApprover(Employee $applicant): ?Employee
    {
        return match ($this->approver_type) {
            'reporting_manager' => $applicant->reportingManager,
            'department_head'   => $applicant->department?->head,
            'hr_manager'        => null, // any tenant_admin user — handled at controller level
            'specific_employee' => $this->specificEmployee,
            default             => null,
        };
    }
}
