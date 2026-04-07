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
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique()->index(); // free, starter, professional, enterprise
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('monthly_price', 10, 2)->default(0);
            $table->decimal('annual_price', 10, 2)->default(0);
            $table->json('features')->nullable(); // {tasks_limit: 100, users: 5, storage_gb: 10}
            $table->boolean('is_active')->default(true)->index();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('plan_features', function (Blueprint $table) {
            $table->id();
            $table->uuid('plan_id');
            $table->string('feature_key'); // tasks_per_month, users_allowed, storage_gb
            $table->string('feature_value');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('plan_id')->references('id')->on('subscription_plans')->onDelete('cascade');
            $table->unique(['plan_id', 'feature_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_features');
        Schema::dropIfExists('subscription_plans');
    }
};
