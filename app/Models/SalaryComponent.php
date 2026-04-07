<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryComponent extends Model
{
    protected $fillable = [
        'tenant_id', 'salary_structure_id',
        'name', 'code', 'payslip_display_name', 'show_on_payslip',
        'type', 'calculation_type', 'value', 'formula',
        'frequency', 'is_part_of_ctc', 'reduces_on_lop',
        'is_taxable', 'tax_exemption_section',
        'is_pf_applicable', 'is_esi_applicable',
        'is_flexible', 'flexible_min_value', 'flexible_max_value',
        'is_variable', 'include_in_arrears',
        'applicable_employment_types', 'rounding',
        'display_order', 'is_active',
    ];

    protected $casts = [
        'is_taxable'                   => 'boolean',
        'is_pf_applicable'             => 'boolean',
        'is_esi_applicable'            => 'boolean',
        'is_flexible'                  => 'boolean',
        'is_variable'                  => 'boolean',
        'is_part_of_ctc'               => 'boolean',
        'reduces_on_lop'               => 'boolean',
        'show_on_payslip'              => 'boolean',
        'include_in_arrears'           => 'boolean',
        'is_active'                    => 'boolean',
        'value'                        => 'decimal:4',
        'flexible_min_value'           => 'decimal:2',
        'flexible_max_value'           => 'decimal:2',
        'applicable_employment_types'  => 'array',
    ];

    public static array $FREQUENCY_LABELS = [
        'monthly'   => 'Every Month',
        'quarterly' => 'Every Quarter',
        'annual'    => 'Once a Year',
        'adhoc'     => 'Ad-hoc (manual)',
    ];

    public function salaryStructure(): BelongsTo
    {
        return $this->belongsTo(SalaryStructure::class);
    }

    /** Label to use on payslip (falls back to component name if not set) */
    public function getPayslipLabelAttribute(): string
    {
        return $this->payslip_display_name ?: $this->name;
    }
}
