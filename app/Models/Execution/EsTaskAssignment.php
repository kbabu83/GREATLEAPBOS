<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class EsTaskAssignment extends Model {
    protected $table = 'es_task_assignments';
    protected $fillable = ['tenant_id','task_id','previous_user_id','new_user_id','assigned_by_user_id','reason'];

    public function task(): BelongsTo { return $this->belongsTo(EsTask::class, 'task_id'); }
    public function previousUser(): BelongsTo { return $this->belongsTo(User::class, 'previous_user_id'); }
    public function newUser(): BelongsTo { return $this->belongsTo(User::class, 'new_user_id'); }
    public function assignedBy(): BelongsTo { return $this->belongsTo(User::class, 'assigned_by_user_id'); }
}
