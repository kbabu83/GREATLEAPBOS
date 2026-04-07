<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EsRoleSkill extends Model {
    protected $table = 'es_role_skills';
    protected $fillable = ['tenant_id','role_id','hard_skills','soft_skills'];
    protected $casts = ['hard_skills' => 'array', 'soft_skills' => 'array'];

    public function role(): BelongsTo { return $this->belongsTo(EsRole::class, 'role_id'); }
}
