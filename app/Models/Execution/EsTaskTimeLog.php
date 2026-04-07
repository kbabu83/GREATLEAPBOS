<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class EsTaskTimeLog extends Model {
    protected $table = 'es_task_time_logs';
    protected $fillable = ['tenant_id','task_id','user_id','start_time','end_time','duration_minutes','notes'];
    protected $casts = ['start_time' => 'datetime', 'end_time' => 'datetime', 'duration_minutes' => 'integer'];

    public function task(): BelongsTo { return $this->belongsTo(EsTask::class, 'task_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }

    public static function computeDuration(\Carbon\Carbon $start, \Carbon\Carbon $end): int {
        return (int) $start->diffInMinutes($end);
    }
}
