<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id', 'employee_code', 'user_id',
        // Personal
        'first_name', 'last_name', 'display_name',
        'work_email', 'personal_email', 'phone', 'alternate_phone',
        'date_of_birth', 'gender', 'blood_group', 'marital_status',
        'nationality', 'religion', 'profile_photo',
        // Employment
        'department_id', 'designation_id', 'branch_id', 'reporting_manager_id',
        'employment_type', 'employment_status',
        'date_of_joining', 'date_of_confirmation', 'notice_period_days',
        'date_of_exit', 'exit_reason', 'exit_remarks', 'work_location_type',
        // Address
        'current_address', 'permanent_address', 'same_as_current_address',
        // IDs
        'pan_number', 'aadhar_number', 'uan_number', 'esi_number',
        'passport_number', 'passport_expiry', 'driving_license',
        // Bank
        'bank_account_number', 'bank_name', 'bank_ifsc', 'bank_branch', 'bank_account_type',
        // Emergency
        'emergency_contact_name', 'emergency_contact_relation', 'emergency_contact_phone',
        // Meta
        'is_active', 'onboarding_completed_at', 'custom_fields', 'created_by',
    ];

    protected $casts = [
        'date_of_birth'             => 'date',
        'date_of_joining'           => 'date',
        'date_of_confirmation'      => 'date',
        'date_of_exit'              => 'date',
        'passport_expiry'           => 'date',
        'onboarding_completed_at'   => 'datetime',
        'current_address'           => 'array',
        'permanent_address'         => 'array',
        'custom_fields'             => 'array',
        'same_as_current_address'   => 'boolean',
        'is_active'                 => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function reportingManager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'reporting_manager_id');
    }

    public function directReports(): HasMany
    {
        return $this->hasMany(Employee::class, 'reporting_manager_id');
    }

    public function salaryAssignments(): HasMany
    {
        return $this->hasMany(EmployeeSalaryAssignment::class);
    }

    public function currentSalary(): HasOne
    {
        return $this->hasOne(EmployeeSalaryAssignment::class)
                    ->whereNull('effective_to')
                    ->latest('effective_from');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('employment_status', ['active', 'probation', 'notice_period']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getOnboardingProgressAttribute(): int
    {
        $fields  = ['work_email','phone','date_of_birth','pan_number',
                    'bank_account_number','bank_ifsc','current_address'];
        $filled  = count(array_filter($fields, fn($f) => !empty($this->$f)));
        return (int) round(($filled / count($fields)) * 100);
    }

    public function isOnboardingComplete(): bool
    {
        return $this->onboarding_completed_at !== null;
    }
}
