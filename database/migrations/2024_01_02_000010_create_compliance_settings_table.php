<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compliance_settings', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->unique();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');

            // ── Provident Fund (PF) ───────────────────────────────────────────
            $table->boolean('pf_applicable')->default(false);
            $table->string('pf_registration_number')->nullable();
            $table->decimal('pf_employee_rate', 5, 2)->default(12.00);   // % of basic
            $table->decimal('pf_employer_rate', 5, 2)->default(12.00);
            $table->decimal('pf_wage_ceiling', 10, 2)->default(15000.00);
            $table->boolean('pf_on_actual_basic')->default(false); // ignore ceiling if true

            // ── ESI ────────────────────────────────────────────────────────────
            $table->boolean('esi_applicable')->default(false);
            $table->string('esi_registration_number')->nullable();
            $table->decimal('esi_employee_rate', 5, 2)->default(0.75);
            $table->decimal('esi_employer_rate', 5, 2)->default(3.25);
            $table->decimal('esi_wage_ceiling', 10, 2)->default(21000.00);

            // ── Professional Tax (PT) ──────────────────────────────────────────
            $table->boolean('pt_applicable')->default(false);
            $table->string('pt_state')->nullable();
            $table->json('pt_slabs')->nullable();
            // Format: [{"from":0,"to":10000,"amount":0},{"from":10001,"to":null,"amount":200}]

            // ── TDS (Income Tax) ───────────────────────────────────────────────
            $table->boolean('tds_applicable')->default(false);
            $table->enum('tds_regime', ['old', 'new'])->default('new');

            // ── Labour Welfare Fund (LWF) ──────────────────────────────────────
            $table->boolean('lwf_applicable')->default(false);
            $table->decimal('lwf_employee_amount', 8, 2)->default(0);
            $table->decimal('lwf_employer_amount', 8, 2)->default(0);
            $table->string('lwf_state')->nullable();

            // ── Gratuity ───────────────────────────────────────────────────────
            $table->boolean('gratuity_applicable')->default(false);
            $table->decimal('gratuity_rate', 5, 2)->default(4.81); // 15/26 * ~8.33%

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compliance_settings');
    }
};
