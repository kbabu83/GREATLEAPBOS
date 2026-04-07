<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class EsActivityLog extends Model {
    protected $table = 'es_activity_logs';
    protected $fillable = ['tenant_id','user_id','action_type','entity_type','entity_id','metadata'];
    protected $casts = ['metadata' => 'array'];
    public $updatedAt = false; // no updated_at needed

    public function user(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }

    public static array $ACTION_TYPES = [
        'task_created','task_updated','task_completed','task_cancelled',
        'task_assigned','time_logged','note_added','review_added',
        'role_created','role_updated',
    ];
}
