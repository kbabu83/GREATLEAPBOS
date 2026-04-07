<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EsRolePerformanceDefinition extends Model {
    protected $table = 'es_role_performance_definitions';
    protected $fillable = ['tenant_id','role_id','excellent_definition','average_definition','poor_definition'];

    public function role(): BelongsTo { return $this->belongsTo(EsRole::class, 'role_id'); }
}
