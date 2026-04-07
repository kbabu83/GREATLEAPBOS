<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class EsTaskReview extends Model {
    protected $table = 'es_task_reviews';
    protected $fillable = ['tenant_id','task_id','reviewer_id','status','quality_score','remarks','reviewed_at'];
    protected $casts = ['reviewed_at' => 'datetime', 'quality_score' => 'integer'];

    public function task(): BelongsTo { return $this->belongsTo(EsTask::class, 'task_id'); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewer_id'); }
}
