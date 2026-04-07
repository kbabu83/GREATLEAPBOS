<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganisationSetting extends Model
{
    protected $fillable = [
        'tenant_id', 'legal_name', 'trade_name', 'tagline', 'about', 'industry', 'company_size',
        'registration_number', 'gst_number', 'pan_number',
        'phone', 'email', 'website', 'logo_path',
        'address_line1', 'address_line2', 'city', 'state', 'country', 'pincode',
        'financial_year_start_month', 'timezone', 'currency', 'date_format',
        'employee_id_prefix', 'employee_id_next_number',
        'vision', 'mission', 'core_values',
        'products', 'services', 'major_clients',
        'quality_policy', 'company_goals', 'key_processes',
    ];

    protected $casts = [
        'core_values'   => 'array',
        'products'      => 'array',
        'services'      => 'array',
        'major_clients' => 'array',
        'company_goals' => 'array',
        'key_processes' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /** Generate and increment the next employee code atomically. */
    public function generateEmployeeCode(): string
    {
        // Lock the row to prevent race conditions on concurrent employee creation
        $setting = static::where('tenant_id', $this->tenant_id)->lockForUpdate()->first();
        $code    = $setting->employee_id_prefix . str_pad($setting->employee_id_next_number, 4, '0', STR_PAD_LEFT);
        $setting->increment('employee_id_next_number');
        return $code;
    }
}
