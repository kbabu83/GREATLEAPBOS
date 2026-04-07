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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id', 50)->index();
            $table->uuid('plan_id');
            $table->enum('billing_cycle', ['monthly', 'annual'])->default('monthly');
            $table->decimal('current_price', 10, 2);
            $table->enum('status', ['trial', 'active', 'suspended', 'cancelled'])->default('trial')->index();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('next_billing_date')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'plan_id']);
        });

        Schema::create('user_subscription_overrides', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id', 50)->index();
            $table->unsignedBigInteger('user_id');
            $table->uuid('plan_id');
            $table->decimal('monthly_price', 10, 2)->nullable();
            $table->decimal('annual_price', 10, 2)->nullable();
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_to')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by_user_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['tenant_id', 'user_id']);
            $table->index(['tenant_id', 'effective_from']);
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id', 50)->index();
            $table->uuid('subscription_id');
            $table->string('invoice_number')->index();
            $table->decimal('amount', 12, 2);
            $table->string('currency')->default('INR');
            $table->enum('status', ['draft', 'sent', 'paid', 'failed', 'refunded'])->default('draft')->index();
            $table->string('payment_method')->nullable(); // razorpay, manual, credit
            $table->string('razorpay_order_id')->nullable()->unique();
            $table->string('razorpay_payment_id')->nullable()->unique();
            $table->date('billing_period_start')->nullable();
            $table->date('billing_period_end')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('subscription_id')->references('id')->on('subscriptions')->onDelete('cascade');
            $table->unique(['tenant_id', 'invoice_number']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id', 50)->index();
            $table->uuid('invoice_id')->nullable();
            $table->string('razorpay_payment_id')->nullable()->unique();
            $table->decimal('amount', 12, 2);
            $table->string('currency')->default('INR');
            $table->enum('status', ['created', 'authorized', 'captured', 'failed', 'refunded'])->default('created')->index();
            $table->json('payment_method_details')->nullable(); // card, upi, etc.
            $table->json('razorpay_response')->nullable(); // Full API response
            $table->text('error_message')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('set null');
            $table->index(['tenant_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('user_subscription_overrides');
        Schema::dropIfExists('subscriptions');
    }
};
