<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EsRoleActivity extends Model {
    protected $table = 'es_role_activities';
    protected $fillable = ['tenant_id','role_id','area_id','activity_name','description','frequency_type','frequency_value','is_active'];
    protected $casts = ['is_active' => 'boolean'];
    public static array $FREQUENCY_TYPES = ['daily','weekly','monthly','quarterly','yearly'];

    public function role(): BelongsTo { return $this->belongsTo(EsRole::class, 'role_id'); }
    public function area(): BelongsTo { return $this->belongsTo(EsRoleArea::class, 'area_id'); }
}
