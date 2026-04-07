<?php

namespace Database\Seeders;

use App\Models\Central\SubscriptionPlan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'id' => 'free',
                'slug' => 'free',
                'name' => 'Free',
                'description' => 'Perfect for getting started',
                'per_user_price' => 0.00,
                'max_users' => 5,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'id' => 'starter',
                'slug' => 'starter',
                'name' => 'Starter',
                'description' => 'Great for small teams',
                'per_user_price' => 199.00,
                'max_users' => null,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'id' => 'professional',
                'slug' => 'professional',
                'name' => 'Professional',
                'description' => 'For growing organizations',
                'per_user_price' => 299.00,
                'max_users' => null,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'id' => 'enterprise',
                'slug' => 'enterprise',
                'name' => 'Enterprise',
                'description' => 'For large enterprises',
                'per_user_price' => 399.00,
                'max_users' => null,
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::firstOrCreate(
                ['id' => $plan['id']],
                $plan
            );
        }

        $this->command->info('✓ Subscription plans seeded successfully!');
    }
}
