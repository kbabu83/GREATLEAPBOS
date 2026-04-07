<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class EsTaskObserver extends Model {
    protected $table = 'es_task_observers';
    protected $fillable = ['tenant_id','task_id','user_id'];

    public function task(): BelongsTo { return $this->belongsTo(EsTask::class, 'task_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
}
