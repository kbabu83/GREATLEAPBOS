<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('es_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36)->index();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('assigned_user_id')->nullable();
            $table->unsignedBigInteger('created_by_user_id');
            $table->unsignedBigInteger('area_id')->nullable();
            $table->unsignedBigInteger('activity_id')->nullable();
            $table->enum('status', ['pending','in_progress','completed','cancelled'])->default('pending');
            $table->enum('priority', ['low','medium','high','urgent'])->default('medium');
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('role_id')->references('id')->on('es_roles');
            $table->foreign('area_id')->references('id')->on('es_role_areas')->nullOnDelete();
            $table->foreign('activity_id')->references('id')->on('es_role_activities')->nullOnDelete();
            $table->index(['tenant_id', 'assigned_user_id', 'status']);
            $table->index(['tenant_id', 'role_id', 'status']);
            $table->index(['tenant_id', 'due_date']);
        });
    }
    public function down(): void { Schema::dropIfExists('es_tasks'); }
};
