<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class EsTaskNote extends Model {
    protected $table = 'es_task_notes';
    protected $fillable = ['tenant_id','task_id','user_id','note'];

    public function task(): BelongsTo { return $this->belongsTo(EsTask::class, 'task_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
}
