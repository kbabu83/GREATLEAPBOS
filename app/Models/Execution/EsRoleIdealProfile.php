<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EsRoleIdealProfile extends Model {
    protected $table = 'es_role_ideal_profiles';
    protected $fillable = ['tenant_id','role_id','education','experience_range','additional_requirements'];

    public function role(): BelongsTo { return $this->belongsTo(EsRole::class, 'role_id'); }
}
