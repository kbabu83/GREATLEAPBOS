<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EsAreaParameter extends Model {
    protected $table = 'es_area_parameters';
    protected $fillable = ['tenant_id','area_id','role_id','parameter_name','description'];

    public function area(): BelongsTo { return $this->belongsTo(EsRoleArea::class, 'area_id'); }
    public function role(): BelongsTo { return $this->belongsTo(EsRole::class, 'role_id'); }
}
