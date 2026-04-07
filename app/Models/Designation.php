<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Designation extends Model
{
    protected $fillable = [
        'tenant_id', 'title', 'code', 'department_id',
        'level', 'description', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean', 'level' => 'integer'];

    public static array $LEVELS = [
        1 => 'Junior',
        2 => 'Mid-Level',
        3 => 'Senior',
        4 => 'Lead',
        5 => 'Manager',
        6 => 'Director',
        7 => 'VP',
        8 => 'C-Suite',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function getLevelLabelAttribute(): string
    {
        return self::$LEVELS[$this->level] ?? 'Unknown';
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
