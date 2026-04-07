<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = [
        'tenant_id', 'name', 'code', 'is_head_office',
        'address_line1', 'address_line2', 'city', 'state', 'country', 'pincode',
        'phone', 'email', 'is_active',
    ];

    protected $casts = ['is_head_office' => 'boolean', 'is_active' => 'boolean'];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
