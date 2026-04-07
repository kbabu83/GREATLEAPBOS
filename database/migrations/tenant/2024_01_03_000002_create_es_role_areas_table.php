<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('es_role_areas', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36)->index();
            $table->unsignedBigInteger('role_id');
            $table->string('area_name');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('display_order')->default(0);
            $table->timestamps();
            $table->foreign('role_id')->references('id')->on('es_roles')->cascadeOnDelete();
            $table->index(['tenant_id', 'role_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('es_role_areas'); }
};
