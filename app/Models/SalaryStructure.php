<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalaryStructure extends Model
{
    protected $fillable = ['tenant_id', 'name', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function components(): HasMany
    {
        return $this->hasMany(SalaryComponent::class)->orderBy('display_order');
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(SalaryComponent::class)
                    ->where('type', 'earning')
                    ->orderBy('display_order');
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(SalaryComponent::class)
                    ->where('type', 'deduction')
                    ->orderBy('display_order');
    }

    public function employerContributions(): HasMany
    {
        return $this->hasMany(SalaryComponent::class)
                    ->where('type', 'employer_contribution')
                    ->orderBy('display_order');
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Calculate component-wise salary breakdown for a given gross amount.
     */
    public function calculateBreakdown(float $gross, float $basic): array
    {
        $breakdown = [];
        foreach ($this->components as $comp) {
            $amount = match ($comp->calculation_type) {
                'fixed'                => $comp->value,
                'percentage_of_basic'  => round($basic * $comp->value / 100, 2),
                'percentage_of_gross'  => round($gross * $comp->value / 100, 2),
                default                => $comp->value,
            };
            $breakdown[] = [
                'component_id'   => $comp->id,
                'name'           => $comp->name,
                'code'           => $comp->code,
                'type'           => $comp->type,
                'amount'         => $amount,
                'is_taxable'     => $comp->is_taxable,
            ];
        }
        return $breakdown;
    }
}
