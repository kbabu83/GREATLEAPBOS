<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('es_role_activities', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36)->index();
            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('area_id')->nullable();
            $table->string('activity_name');
            $table->text('description')->nullable();
            $table->enum('frequency_type', ['daily','weekly','monthly','quarterly','yearly'])->default('daily');
            $table->string('frequency_value')->nullable()->comment('e.g. every monday, 1st-5th of month');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('role_id')->references('id')->on('es_roles')->cascadeOnDelete();
            $table->foreign('area_id')->references('id')->on('es_role_areas')->nullOnDelete();
            $table->index(['tenant_id', 'role_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('es_role_activities'); }
};
