<?php

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPlanFeature extends Model
{
    use HasFactory;

    protected $connection = 'central';

    protected $table = 'plan_features';

    protected $fillable = [
        'plan_id',
        'feature_key',
        'feature_value',
        'description',
    ];

    /**
     * Get the subscription plan this feature belongs to
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id', 'id');
    }
}
