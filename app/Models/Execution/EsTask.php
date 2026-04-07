<?php
namespace App\Models\Execution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

class EsTask extends Model {
    use SoftDeletes;
    protected $table = 'es_tasks';
    protected $fillable = [
        'tenant_id','title','description','role_id','assigned_user_id','created_by_user_id',
        'area_id','activity_id','status','priority','due_date','completed_at',
    ];
    protected $casts = ['due_date' => 'date', 'completed_at' => 'datetime'];

    public static array $STATUSES   = ['pending','in_progress','completed','cancelled'];
    public static array $PRIORITIES = ['low','medium','high','urgent'];

    public function role(): BelongsTo       { return $this->belongsTo(EsRole::class, 'role_id'); }
    public function area(): BelongsTo       { return $this->belongsTo(EsRoleArea::class, 'area_id'); }
    public function activity(): BelongsTo   { return $this->belongsTo(EsRoleActivity::class, 'activity_id'); }
    public function assignedUser(): BelongsTo { return $this->belongsTo(User::class, 'assigned_user_id'); }
    public function createdBy(): BelongsTo  { return $this->belongsTo(User::class, 'created_by_user_id'); }
    public function notes(): HasMany        { return $this->hasMany(EsTaskNote::class, 'task_id')->latest(); }
    public function timeLogs(): HasMany     { return $this->hasMany(EsTaskTimeLog::class, 'task_id')->latest(); }
    public function assignments(): HasMany  { return $this->hasMany(EsTaskAssignment::class, 'task_id')->latest(); }
    public function reviews(): HasMany      { return $this->hasMany(EsTaskReview::class, 'task_id')->latest(); }
    public function observers(): HasMany    { return $this->hasMany(EsTaskObserver::class, 'task_id'); }

    public function scopeForTenant($query, string $tenantId) { return $query->where('tenant_id', $tenantId); }
    public function scopeAssignedTo($query, int $userId) { return $query->where('assigned_user_id', $userId); }
    public function scopeActive($query) { return $query->whereNotIn('status', ['completed','cancelled']); }
    public function isDueTodayOrOverdue(): bool {
        return $this->due_date && $this->due_date->lte(now()->startOfDay());
    }
    public function totalLoggedMinutes(): int {
        return $this->timeLogs->sum('duration_minutes');
    }
}
