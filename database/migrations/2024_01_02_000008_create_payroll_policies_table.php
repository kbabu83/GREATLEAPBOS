<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_policies', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->string('name');
            $table->boolean('is_default')->default(false);

            // ── Attendance Cycle ───────────────────────────────────────────────
            // (period during which attendance is collected)
            $table->enum('attendance_cycle_type', ['calendar_month', 'custom'])
                  ->default('calendar_month');
            $table->unsignedTinyInteger('attendance_cycle_start_day')->default(1);
            // e.g. 25 means attendance from 25th of prev month to 24th of this month

            // ── Payroll Cycle ─────────────────────────────────────────────────
            // (period for which salary is calculated and disbursed)
            $table->enum('payroll_cycle_type', ['calendar_month', 'custom'])
                  ->default('calendar_month');
            $table->unsignedTinyInteger('payroll_cycle_start_day')->default(1);

            // ── Payment ────────────────────────────────────────────────────────
            $table->enum('payment_frequency', ['monthly', 'weekly', 'daily', 'adhoc'])
                  ->default('monthly');
            $table->unsignedTinyInteger('payment_day')->default(28); // which day of month

            // ── Salary Calculation ─────────────────────────────────────────────
            // For monthly salaried: how to calculate per-day value
            $table->enum('working_days_basis', [
                'calendar_days',         // salary / days in month
                'fixed_26',              // salary / 26 (standard)
                'fixed_30',              // salary / 30
                'actual_working_days',   // based on scheduled working days
            ])->default('fixed_26');

            // Loss of Pay calculation
            $table->boolean('lop_applicable')->default(true);
            $table->enum('lop_deduction_basis', ['per_day', 'per_half_day'])->default('per_day');

            // ── Payroll Control / Blocks ───────────────────────────────────────
            $table->boolean('block_on_missing_attendance')->default(false);
            $table->boolean('block_on_missing_pan')->default(false);
            $table->boolean('block_on_missing_bank_details')->default(true);
            $table->boolean('block_on_missing_uan')->default(false);

            // Include arrears from previous period
            $table->boolean('include_arrears')->default(true);

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_policies');
    }
};
