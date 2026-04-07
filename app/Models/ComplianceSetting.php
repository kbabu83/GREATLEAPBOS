<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplianceSetting extends Model
{
    protected $fillable = [
        'tenant_id',
        'pf_applicable', 'pf_registration_number', 'pf_employee_rate',
        'pf_employer_rate', 'pf_wage_ceiling', 'pf_on_actual_basic',
        'esi_applicable', 'esi_registration_number', 'esi_employee_rate',
        'esi_employer_rate', 'esi_wage_ceiling',
        'pt_applicable', 'pt_state', 'pt_slabs',
        'tds_applicable', 'tds_regime',
        'lwf_applicable', 'lwf_employee_amount', 'lwf_employer_amount', 'lwf_state',
        'gratuity_applicable', 'gratuity_rate',
    ];

    protected $casts = [
        'pf_applicable'       => 'boolean',
        'pf_on_actual_basic'  => 'boolean',
        'esi_applicable'      => 'boolean',
        'pt_applicable'       => 'boolean',
        'pt_slabs'            => 'array',
        'tds_applicable'      => 'boolean',
        'lwf_applicable'      => 'boolean',
        'gratuity_applicable' => 'boolean',
        'pf_employee_rate'    => 'decimal:2',
        'pf_employer_rate'    => 'decimal:2',
        'pf_wage_ceiling'     => 'decimal:2',
        'esi_employee_rate'   => 'decimal:2',
        'esi_employer_rate'   => 'decimal:2',
        'esi_wage_ceiling'    => 'decimal:2',
        'gratuity_rate'       => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Calculate PF deduction for a given basic salary.
     */
    public function calculatePF(float $basic): array
    {
        if (!$this->pf_applicable) return ['employee' => 0, 'employer' => 0];
        $base     = $this->pf_on_actual_basic ? $basic : min($basic, $this->pf_wage_ceiling);
        return [
            'employee' => round($base * $this->pf_employee_rate / 100, 2),
            'employer' => round($base * $this->pf_employer_rate / 100, 2),
        ];
    }

    /**
     * Calculate ESI deduction for a given gross salary.
     */
    public function calculateESI(float $gross): array
    {
        if (!$this->esi_applicable || $gross > $this->esi_wage_ceiling) {
            return ['employee' => 0, 'employer' => 0];
        }
        return [
            'employee' => round($gross * $this->esi_employee_rate / 100, 2),
            'employer' => round($gross * $this->esi_employer_rate / 100, 2),
        ];
    }

    /**
     * Calculate Professional Tax for a given gross salary.
     */
    public function calculatePT(float $gross): float
    {
        if (!$this->pt_applicable || empty($this->pt_slabs)) return 0;
        foreach ($this->pt_slabs as $slab) {
            $to = $slab['to'] ?? PHP_INT_MAX;
            if ($gross >= $slab['from'] && $gross <= $to) {
                return (float) $slab['amount'];
            }
        }
        return 0;
    }
}
