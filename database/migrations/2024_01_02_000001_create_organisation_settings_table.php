<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organisation_settings', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->unique();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');

            // Identity
            $table->string('legal_name')->nullable();
            $table->string('trade_name')->nullable();
            $table->string('industry')->nullable();
            $table->string('company_size')->nullable(); // micro/small/medium/large
            $table->string('registration_number')->nullable();
            $table->string('gst_number', 20)->nullable();
            $table->string('pan_number', 15)->nullable();

            // Contact
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('logo_path')->nullable();

            // Address (head office)
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->default('India');
            $table->string('pincode', 10)->nullable();

            // System Settings
            $table->unsignedTinyInteger('financial_year_start_month')->default(4); // April
            $table->string('timezone')->default('Asia/Kolkata');
            $table->string('currency', 3)->default('INR');
            $table->string('date_format')->default('DD/MM/YYYY');

            // Employee ID generation
            $table->string('employee_id_prefix', 10)->default('EMP');
            $table->unsignedInteger('employee_id_next_number')->default(1);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organisation_settings');
    }
};
