<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_components', function (Blueprint $table) {

            // ── Payslip Display ───────────────────────────────────────────────
            $table->string('payslip_display_name')->nullable()->after('code');
            // Name printed on payslip (e.g. "House Rent Allowance" instead of "HRA")
            $table->boolean('show_on_payslip')->default(true)->after('payslip_display_name');

            // ── Payment Frequency ─────────────────────────────────────────────
            // monthly = every pay cycle | quarterly = every 3 months | annual = once/year | adhoc = manual trigger
            $table->enum('frequency', ['monthly', 'quarterly', 'annual', 'adhoc'])
                  ->default('monthly')->after('show_on_payslip');

            // ── CTC Classification ────────────────────────────────────────────
            $table->boolean('is_part_of_ctc')->default(true)->after('frequency');
            // is_part_of_ctc=false → out-of-CTC reimbursements (medical bills etc.)

            // ── LOP Impact ────────────────────────────────────────────────────
            // If true, this component is reduced proportionally when LOP deduction is applied.
            // Most allowances: true. Some flat reimbursements (phone bill, internet): false.
            $table->boolean('reduces_on_lop')->default(true)->after('is_part_of_ctc');

            // ── Tax Classification ────────────────────────────────────────────
            // Which Section exempts this component from income tax (for TDS computation)
            $table->string('tax_exemption_section', 20)->nullable()->after('is_taxable');
            // Examples: 'HRA', '10(14)', '80C', 'LTA', 'MEDICAL', null = no exemption

            // ── Flexible / Variable ───────────────────────────────────────────
            // Flexible: employee can declare amount within a range (e.g. HRA in rent city)
            $table->boolean('is_flexible')->default(false)->after('tax_exemption_section');
            $table->decimal('flexible_min_value', 10, 2)->nullable()->after('is_flexible');
            $table->decimal('flexible_max_value', 10, 2)->nullable()->after('flexible_min_value');

            // Variable: value changes each month (e.g. performance incentive — entered during payroll)
            $table->boolean('is_variable')->default(false)->after('flexible_max_value');

            // ── Arrears ───────────────────────────────────────────────────────
            // Whether to include this component when generating salary arrears
            $table->boolean('include_in_arrears')->default(true)->after('is_variable');

            // ── Conditions (simple applicability rule) ────────────────────────
            // Apply only for specific employment types (null = all)
            $table->json('applicable_employment_types')->nullable()->after('include_in_arrears');

            // ── Rounding ──────────────────────────────────────────────────────
            $table->enum('rounding', ['none', 'round', 'floor', 'ceil'])
                  ->default('round')->after('applicable_employment_types');
        });
    }

    public function down(): void
    {
        Schema::table('salary_components', function (Blueprint $table) {
            $table->dropColumn([
                'payslip_display_name', 'show_on_payslip', 'frequency', 'is_part_of_ctc',
                'reduces_on_lop', 'tax_exemption_section', 'is_flexible',
                'flexible_min_value', 'flexible_max_value', 'is_variable',
                'include_in_arrears', 'applicable_employment_types', 'rounding',
            ]);
        });
    }
};
