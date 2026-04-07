<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_leave_balances', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();

            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');

            $table->unsignedBigInteger('leave_type_id');
            $table->foreign('leave_type_id')->references('id')->on('leave_types')->onDelete('cascade');

            $table->unsignedSmallInteger('year');  // e.g. 2025

            // ── Balance Components ────────────────────────────────────────────
            // Total entitlement = opening_balance + accrued + carry_forward + additional_granted
            $table->decimal('opening_balance',     6, 2)->default(0); // lump-sum credit at year start
            $table->decimal('accrued',             6, 2)->default(0); // accumulated via monthly/quarterly accrual
            $table->decimal('carry_forward',       6, 2)->default(0); // carried over from previous year
            $table->decimal('additional_granted',  6, 2)->default(0); // manually added by admin

            // ── Consumption ───────────────────────────────────────────────────
            $table->decimal('availed',  6, 2)->default(0); // approved + completed leave days
            $table->decimal('pending',  6, 2)->default(0); // days in active pending applications
            $table->decimal('encashed', 6, 2)->default(0); // days converted to cash
            $table->decimal('lapsed',   6, 2)->default(0); // expired carry-forward balance

            // ── Derived (for quick read) ───────────────────────────────────────
            // available_balance = (opening + accrued + carry_forward + additional) - availed - pending - encashed
            // Stored as a computed snapshot, refreshed on every transaction
            $table->decimal('available_balance', 6, 2)->default(0);

            $table->date('last_accrual_date')->nullable();
            $table->date('carry_forward_expires_on')->nullable(); // when CF balance lapses

            $table->timestamps();

            $table->unique(['employee_id', 'leave_type_id', 'year']);
            $table->index(['tenant_id', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_leave_balances');
    }
};
