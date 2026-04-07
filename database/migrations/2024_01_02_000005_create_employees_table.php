<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->string('employee_code', 30)->nullable(); // EMP001

            // Portal access (optional)
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();

            // ── Personal Information ─────────────────────────────────────────
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('display_name')->nullable();     // override full name display
            $table->string('work_email')->nullable();
            $table->string('personal_email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('alternate_phone', 20)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other', 'prefer_not_to_say'])->nullable();
            $table->string('blood_group', 5)->nullable();
            $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable();
            $table->string('nationality')->default('Indian');
            $table->string('religion')->nullable();
            $table->string('profile_photo')->nullable();

            // ── Employment ───────────────────────────────────────────────────
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('designation_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->unsignedBigInteger('reporting_manager_id')->nullable(); // FK to employees.id

            $table->enum('employment_type', ['monthly_salaried', 'daily_wage', 'hourly_wage'])
                  ->default('monthly_salaried');
            $table->enum('employment_status', [
                'active', 'probation', 'notice_period',
                'resigned', 'terminated', 'absconded', 'inactive',
            ])->default('probation');

            $table->date('date_of_joining');
            $table->date('date_of_confirmation')->nullable();  // probation end date
            $table->unsignedSmallInteger('notice_period_days')->default(30);
            $table->date('date_of_exit')->nullable();
            $table->string('exit_reason')->nullable();
            $table->text('exit_remarks')->nullable();

            $table->enum('work_location_type', ['office', 'remote', 'hybrid'])->default('office');

            // ── Address ──────────────────────────────────────────────────────
            $table->json('current_address')->nullable();   // {line1,line2,city,state,pincode,country}
            $table->json('permanent_address')->nullable();
            $table->boolean('same_as_current_address')->default(false);

            // ── Government IDs & Compliance ───────────────────────────────────
            $table->string('pan_number', 15)->nullable();
            $table->string('aadhar_number', 12)->nullable();  // store masked or encrypted
            $table->string('uan_number', 20)->nullable();     // PF Universal Account Number
            $table->string('esi_number', 20)->nullable();
            $table->string('passport_number', 20)->nullable();
            $table->date('passport_expiry')->nullable();
            $table->string('driving_license', 20)->nullable();

            // ── Bank Details ──────────────────────────────────────────────────
            $table->string('bank_account_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_ifsc', 15)->nullable();
            $table->string('bank_branch')->nullable();
            $table->string('bank_account_type')->nullable(); // savings/current

            // ── Emergency Contact ─────────────────────────────────────────────
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_relation')->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();

            // ── Status & Metadata ─────────────────────────────────────────────
            $table->boolean('is_active')->default(true);
            $table->timestamp('onboarding_completed_at')->nullable();
            $table->json('custom_fields')->nullable();      // tenant-defined extra fields
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('designation_id')->references('id')->on('designations')->nullOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('reporting_manager_id')->references('id')->on('employees')->nullOnDelete();
            $table->unique(['tenant_id', 'employee_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
