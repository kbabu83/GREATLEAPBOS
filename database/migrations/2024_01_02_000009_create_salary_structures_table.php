<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Salary Structure (template) ───────────────────────────────────────
        Schema::create('salary_structures', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->string('name');                         // e.g. Standard, Senior, Executive
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── Salary Components (within a structure) ────────────────────────────
        Schema::create('salary_components', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->unsignedBigInteger('salary_structure_id');
            $table->foreign('salary_structure_id')
                  ->references('id')->on('salary_structures')->onDelete('cascade');

            $table->string('name');                         // Basic, HRA, TA, PF Employee
            $table->string('code', 20);                     // BASIC, HRA, TA, PF_EMP
            $table->enum('type', ['earning', 'deduction', 'employer_contribution'])
                  ->default('earning');

            // How the value is calculated
            $table->enum('calculation_type', [
                'fixed',                  // fixed rupee amount
                'percentage_of_basic',    // % of basic pay
                'percentage_of_gross',    // % of gross earnings
                'percentage_of_ctc',      // % of CTC
                'formula',                // custom formula string
            ])->default('fixed');

            $table->decimal('value', 10, 4)->default(0);   // amount OR percentage
            $table->string('formula')->nullable();           // e.g. "basic * 0.4"

            // Compliance flags
            $table->boolean('is_taxable')->default(true);
            $table->boolean('is_pf_applicable')->default(false);
            $table->boolean('is_esi_applicable')->default(false);

            $table->unsignedTinyInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['salary_structure_id', 'code']);
        });

        // ── Employee Salary Assignments ───────────────────────────────────────
        Schema::create('employee_salary_assignments', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->unsignedBigInteger('salary_structure_id');
            $table->foreign('salary_structure_id')->references('id')->on('salary_structures');

            $table->decimal('ctc_annual', 12, 2);           // Cost to Company per year
            $table->decimal('gross_monthly', 12, 2);        // Monthly gross earnings
            $table->json('component_overrides')->nullable(); // per-employee overrides
            $table->date('effective_from');
            $table->date('effective_to')->nullable();        // null = current

            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_salary_assignments');
        Schema::dropIfExists('salary_components');
        Schema::dropIfExists('salary_structures');
    }
};
