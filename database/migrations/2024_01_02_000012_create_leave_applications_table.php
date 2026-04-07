<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_applications', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();

            $table->string('application_number', 20)->nullable(); // LA-2025-0001
            $table->index(['tenant_id', 'application_number']);

            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');

            $table->unsignedBigInteger('leave_type_id');
            $table->foreign('leave_type_id')->references('id')->on('leave_types')->onDelete('cascade');

            // ── Duration ─────────────────────────────────────────────────────
            $table->date('from_date');
            $table->date('to_date');
            $table->decimal('total_days', 5, 2);          // computed by system
            $table->boolean('is_half_day')->default(false);
            $table->enum('half_day_session', ['first_half', 'second_half'])->nullable();

            // ── Application Details ───────────────────────────────────────────
            $table->text('reason');
            $table->string('contact_during_leave')->nullable();  // phone / email to reach employee
            $table->string('document_path')->nullable();
            $table->string('document_original_name')->nullable();

            // ── Status & Workflow ─────────────────────────────────────────────
            $table->enum('status', [
                'draft',          // saved but not submitted
                'pending',        // submitted, awaiting approval
                'approved',       // all levels approved
                'rejected',       // any level rejected
                'cancelled',      // cancelled by employee before approval
                'auto_approved',  // approved automatically after timeout
                'withdrawn',      // revoked after approval (with manager consent)
            ])->default('draft')->index();

            $table->unsignedTinyInteger('current_approval_level')->default(0); // 0 = not yet at L1
            $table->unsignedTinyInteger('total_approval_levels')->default(1);

            // ── Cancellation / Withdrawal ─────────────────────────────────────
            $table->text('cancellation_reason')->nullable();
            $table->unsignedBigInteger('cancelled_by_employee_id')->nullable();
            $table->foreign('cancelled_by_employee_id')->references('id')->on('employees')->nullOnDelete();

            // ── Admin grant ───────────────────────────────────────────────────
            $table->boolean('is_admin_granted')->default(false); // HR/admin applied on behalf
            $table->unsignedBigInteger('applied_by_user_id')->nullable(); // if admin applied
            $table->foreign('applied_by_user_id')->references('id')->on('users')->nullOnDelete();

            // ── Timestamps ───────────────────────────────────────────────────
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('auto_approve_at')->nullable(); // scheduled auto-approval time

            $table->timestamps();
            $table->softDeletes();

            $table->index(['employee_id', 'status']);
            $table->index(['tenant_id', 'from_date', 'to_date']);
        });

        // ── Per-Level Approval Tracking ───────────────────────────────────────
        Schema::create('leave_application_approvals', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('leave_application_id');
            $table->foreign('leave_application_id')
                  ->references('id')->on('leave_applications')->onDelete('cascade');

            $table->unsignedTinyInteger('level');   // 1, 2, 3

            $table->enum('approver_type', [
                'reporting_manager',
                'department_head',
                'hr_manager',
                'specific_employee',
                'system',           // auto-approval
            ])->nullable();

            // Who should approve at this level (resolved when application is submitted)
            $table->unsignedBigInteger('assigned_to_employee_id')->nullable();
            $table->foreign('assigned_to_employee_id')
                  ->references('id')->on('employees')->nullOnDelete();

            // Who actually took action
            $table->unsignedBigInteger('actioned_by_employee_id')->nullable();
            $table->foreign('actioned_by_employee_id')
                  ->references('id')->on('employees')->nullOnDelete();

            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'skipped',       // skipped because approver was absent / not configured
                'auto_approved',
            ])->default('pending');

            $table->text('comments')->nullable();
            $table->timestamp('actioned_at')->nullable();

            $table->timestamps();

            $table->unique(['leave_application_id', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_application_approvals');
        Schema::dropIfExists('leave_applications');
    }
};
