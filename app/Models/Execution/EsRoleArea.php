<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EsRoleArea extends Model {
    protected $table = 'es_role_areas';
    protected $fillable = ['tenant_id','role_id','area_name','description','display_order'];
    protected $casts = ['display_order' => 'integer'];

    public function role(): BelongsTo { return $this->belongsTo(EsRole::class, 'role_id'); }
    public function parameters(): HasMany { return $this->hasMany(EsAreaParameter::class, 'area_id'); }
    public function activities(): HasMany { return $this->hasMany(EsRoleActivity::class, 'area_id'); }
}
