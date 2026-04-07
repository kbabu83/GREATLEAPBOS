<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            // Add new columns if they don't exist
            if (!Schema::hasColumn('subscription_plans', 'per_user_price')) {
                $table->decimal('per_user_price', 10, 2)->default(0)->after('description');
            }

            if (!Schema::hasColumn('subscription_plans', 'max_users')) {
                $table->integer('max_users')->nullable()->after('per_user_price');
            }

            if (!Schema::hasColumn('subscription_plans', 'is_configurable')) {
                $table->boolean('is_configurable')->default(true)->after('max_users');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            if (Schema::hasColumn('subscription_plans', 'per_user_price')) {
                $table->dropColumn('per_user_price');
            }
            if (Schema::hasColumn('subscription_plans', 'max_users')) {
                $table->dropColumn('max_users');
            }
            if (Schema::hasColumn('subscription_plans', 'is_configurable')) {
                $table->dropColumn('is_configurable');
            }
        });
    }
};
