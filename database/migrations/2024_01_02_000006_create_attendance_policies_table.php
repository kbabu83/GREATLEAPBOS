<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_policies', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->string('name');
            $table->boolean('is_default')->default(false);

            // Work hours
            $table->decimal('work_hours_per_day', 4, 2)->default(8.00);
            $table->unsignedTinyInteger('work_days_per_week')->default(5);
            $table->time('work_start_time')->default('09:00:00');
            $table->time('work_end_time')->default('18:00:00');
            $table->unsignedSmallInteger('grace_period_minutes')->default(15);

            // Half day
            $table->decimal('half_day_hours', 4, 2)->default(4.00);

            // Overtime
            $table->boolean('overtime_applicable')->default(false);
            $table->decimal('overtime_rate_multiplier', 3, 2)->default(1.50);

            // Late deduction
            $table->boolean('late_deduction_applicable')->default(false);
            $table->enum('late_deduction_type', ['none', 'half_day', 'full_day', 'per_minute'])
                  ->default('none');
            $table->unsignedSmallInteger('late_deduction_after_minutes')->default(30);

            // Attendance cycle (independent from payroll cycle)
            $table->enum('cycle_type', ['calendar_month', 'custom'])->default('calendar_month');
            $table->unsignedTinyInteger('cycle_start_day')->default(1); // 1-28

            // Week off days (JSON array: 0=Sun,1=Mon...6=Sat)
            $table->json('week_off_days')->nullable();    // default: [0,6]

            // Minimum hours to mark present
            $table->decimal('min_hours_for_present', 4, 2)->default(4.00);
            $table->decimal('min_hours_for_half_day', 4, 2)->default(2.00);

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_policies');
    }
};
