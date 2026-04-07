<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSalaryAssignment extends Model
{
    protected $fillable = [
        'tenant_id', 'employee_id', 'salary_structure_id',
        'ctc_annual', 'gross_monthly', 'component_overrides',
        'effective_from', 'effective_to', 'created_by',
    ];

    protected $casts = [
        'component_overrides' => 'array',
        'effective_from'      => 'date',
        'effective_to'        => 'date',
        'ctc_annual'          => 'decimal:2',
        'gross_monthly'       => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function salaryStructure(): BelongsTo
    {
        return $this->belongsTo(SalaryStructure::class);
    }
}
