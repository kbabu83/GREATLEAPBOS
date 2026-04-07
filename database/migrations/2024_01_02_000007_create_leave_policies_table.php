<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Leave Policies ─────────────────────────────────────────────────────
        Schema::create('leave_policies', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_default')->default(false);

            // Year-end settings
            $table->boolean('allow_negative_balance')->default(false);
            $table->unsignedTinyInteger('year_start_month')->default(1);   // month when leave year resets (1=Jan, 4=Apr)
            $table->unsignedTinyInteger('carry_forward_process_month')->default(1); // month CF is credited to next year

            // Applicability — which employees this policy covers
            // null JSON = applies to ALL employees in tenant
            $table->json('applicable_employment_types')->nullable(); // ['monthly_salaried','daily_wage']
            $table->json('applicable_department_ids')->nullable();   // [1,3,5]
            $table->json('applicable_branch_ids')->nullable();       // [1,2]
            $table->json('excluded_employee_ids')->nullable();       // specific exclusions

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── Leave Types (Leave Heads) ──────────────────────────────────────────
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->unsignedBigInteger('leave_policy_id');
            $table->foreign('leave_policy_id')->references('id')->on('leave_policies')->onDelete('cascade');

            // ── Identity ──────────────────────────────────────────────────────
            $table->string('name');                          // Casual Leave
            $table->string('code', 10);                      // CL
            $table->string('color', 7)->default('#3B82F6');  // hex for calendar
            $table->string('icon', 10)->nullable();           // emoji: 🌴
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('display_order')->default(0);

            // ── Paid / Unpaid ─────────────────────────────────────────────────
            $table->boolean('is_paid')->default(true);

            // ── Entitlement & Accrual ─────────────────────────────────────────
            $table->decimal('days_per_year', 6, 2)->default(0);

            // How balance is credited
            $table->enum('accrual_type', [
                'lump_sum',    // full balance at start of leave year
                'monthly',     // X days credited each month
                'quarterly',   // X days credited each quarter
            ])->default('lump_sum');

            // For monthly/quarterly: days credited each period (auto-computed if null → days_per_year / periods)
            $table->decimal('accrual_per_period', 5, 3)->nullable();

            // Accrual eligibility
            $table->boolean('credit_during_probation')->default(false);   // accrue balance while on probation
            $table->boolean('credit_on_loss_of_pay_days')->default(false); // still accrue even on LOP days

            // Proration for new joiners mid-year
            $table->boolean('prorate_on_joining')->default(true);
            $table->enum('prorate_basis', [
                'months_completed',  // floor(months since joining / 12 * annual)
                'calendar_days',     // (days remaining in year / 365) * annual
            ])->default('months_completed');

            $table->boolean('prorate_on_exit')->default(true); // prorate for leavers

            // ── Per-Application Limits ────────────────────────────────────────
            $table->decimal('min_days_per_application', 4, 2)->default(0.5);
            $table->decimal('max_days_per_application', 4, 2)->nullable(); // null = no cap
            $table->decimal('max_consecutive_days', 4, 2)->nullable();     // null = no cap

            // ── Period Limits ─────────────────────────────────────────────────
            $table->decimal('max_days_per_month', 4, 2)->nullable();  // monthly consumption cap
            $table->decimal('max_days_per_quarter', 4, 2)->nullable();

            // ── Half Day / Hourly ─────────────────────────────────────────────
            $table->boolean('allow_half_day')->default(true);

            // ── Application Window ────────────────────────────────────────────
            $table->unsignedSmallInteger('advance_notice_days')->default(0); // must apply N days before
            $table->boolean('allow_backdated_application')->default(true);
            $table->unsignedSmallInteger('max_backdated_days')->default(7);

            // ── Document Requirements ─────────────────────────────────────────
            $table->boolean('requires_document')->default(false);
            $table->unsignedTinyInteger('document_required_after_days')->default(3); // if application > N days

            // ── Sandwich Rule ─────────────────────────────────────────────────
            $table->boolean('include_holidays_in_count')->default(false); // count public holidays within leave
            $table->boolean('include_weekends_in_count')->default(false); // count weekends within leave

            // ── Carry Forward ─────────────────────────────────────────────────
            $table->boolean('carry_forward')->default(false);
            $table->decimal('max_carry_forward_days', 5, 2)->nullable();   // null = carry all unused
            $table->boolean('carry_forward_expires')->default(false);
            $table->unsignedTinyInteger('carry_forward_expiry_months')->nullable(); // expires N months into new year

            // ── Encashment ────────────────────────────────────────────────────
            $table->boolean('encashable')->default(false);
            $table->decimal('max_encashment_days_per_year', 5, 2)->nullable(); // null = no limit
            $table->decimal('min_balance_after_encashment', 4, 2)->default(0); // must retain N days after encash
            $table->boolean('encashment_on_exit')->default(false); // auto-encash on resignation

            // ── Eligibility ───────────────────────────────────────────────────
            $table->enum('gender_restriction', ['none', 'male', 'female'])->default('none');
            $table->json('employment_type_restriction')->nullable(); // null = all types
            $table->unsignedSmallInteger('applicable_after_days')->default(0); // min service days before eligible
            $table->boolean('applicable_during_probation')->default(true);
            $table->json('department_restriction')->nullable();     // null = all departments
            $table->json('branch_restriction')->nullable();         // null = all branches
            $table->json('designation_restriction')->nullable();    // null = all designations
            $table->json('excluded_employee_ids')->nullable();      // specific individual exclusions

            // ── Approval ──────────────────────────────────────────────────────
            $table->unsignedTinyInteger('approval_levels')->default(1); // 1, 2, or 3
            $table->boolean('auto_approve')->default(false);
            $table->unsignedSmallInteger('auto_approve_after_hours')->nullable(); // if no action in N hours
            $table->boolean('notify_hr_on_apply')->default(false);
            $table->boolean('notify_team_on_approval')->default(false);

            // ── Admin / Access Control ────────────────────────────────────────
            $table->boolean('is_admin_only')->default(false); // only HR/admin can grant; employee cannot apply
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['tenant_id', 'code']);
        });

        // ── Configurable Approval Levels per Leave Type ───────────────────────
        Schema::create('leave_type_approval_levels', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('leave_type_id');
            $table->foreign('leave_type_id')->references('id')->on('leave_types')->onDelete('cascade');

            $table->unsignedTinyInteger('level');   // 1, 2, 3

            $table->enum('approver_type', [
                'reporting_manager',   // immediate manager of the employee
                'department_head',     // head_employee_id of the department
                'hr_manager',          // any user with tenant_admin role
                'specific_employee',   // a fixed employee chosen during config
            ])->default('reporting_manager');

            $table->unsignedBigInteger('specific_employee_id')->nullable();
            $table->foreign('specific_employee_id')->references('id')->on('employees')->nullOnDelete();

            $table->boolean('skip_if_approver_on_leave')->default(false);    // escalate if approver absent
            $table->boolean('notify_on_new_application')->default(true);
            $table->boolean('notify_on_cancellation')->default(true);

            $table->timestamps();

            $table->unique(['leave_type_id', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_type_approval_levels');
        Schema::dropIfExists('leave_types');
        Schema::dropIfExists('leave_policies');
    }
};
