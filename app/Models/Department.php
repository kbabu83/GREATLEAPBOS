<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $fillable = [
        'tenant_id', 'name', 'code', 'description',
        'parent_id', 'head_employee_id', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    public function head(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'head_employee_id');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function designations(): HasMany
    {
        return $this->hasMany(Designation::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Recursive tree for API response */
    public function toTree(): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'code'        => $this->code,
            'description' => $this->description,
            'is_active'   => $this->is_active,
            'parent_id'   => $this->parent_id,
            'children'    => $this->children->map->toTree()->values()->all(),
        ];
    }
}
