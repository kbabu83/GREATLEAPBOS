<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EsRole extends Model {
    protected $table = 'es_roles';
    protected $fillable = ['tenant_id','name','purpose','reporting_role_id','is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function areas(): HasMany { return $this->hasMany(EsRoleArea::class, 'role_id')->orderBy('display_order'); }
    public function activities(): HasMany { return $this->hasMany(EsRoleActivity::class, 'role_id'); }
    public function skills(): HasOne { return $this->hasOne(EsRoleSkill::class, 'role_id'); }
    public function idealProfile(): HasOne { return $this->hasOne(EsRoleIdealProfile::class, 'role_id'); }
    public function performanceDefinition(): HasOne { return $this->hasOne(EsRolePerformanceDefinition::class, 'role_id'); }
    public function reportingRole(): BelongsTo { return $this->belongsTo(EsRole::class, 'reporting_role_id'); }
    public function tasks(): HasMany { return $this->hasMany(EsTask::class, 'role_id'); }

    public function scopeForTenant($query, string $tenantId) { return $query->where('tenant_id', $tenantId); }
}
