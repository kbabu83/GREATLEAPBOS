<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('es_area_parameters', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36)->index();
            $table->unsignedBigInteger('area_id');
            $table->unsignedBigInteger('role_id');
            $table->string('parameter_name');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->foreign('area_id')->references('id')->on('es_role_areas')->cascadeOnDelete();
            $table->foreign('role_id')->references('id')->on('es_roles')->cascadeOnDelete();
            $table->index(['tenant_id', 'area_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('es_area_parameters'); }
};
