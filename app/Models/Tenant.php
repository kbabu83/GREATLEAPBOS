<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'email',
            'plan',
            'status',
            'logo',
            'primary_color',
        ];
    }

    protected $fillable = [
        'id',
        'name',
        'email',
        'plan',
        'status',
        'logo',
        'primary_color',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    // Status constants
    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_TRIAL = 'trial';

    // Plan constants
    const PLAN_FREE = 'free';
    const PLAN_STARTER = 'starter';
    const PLAN_PROFESSIONAL = 'professional';
    const PLAN_ENTERPRISE = 'enterprise';

    public function getStatusBadgeAttribute(): string
    {
        return match($this->status) {
            self::STATUS_ACTIVE => 'active',
            self::STATUS_INACTIVE => 'inactive',
            self::STATUS_SUSPENDED => 'suspended',
            self::STATUS_TRIAL => 'trial',
            default => 'unknown',
        };
    }
}
