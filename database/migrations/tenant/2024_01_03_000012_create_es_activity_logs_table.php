<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('es_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36)->index();
            $table->unsignedBigInteger('user_id');
            $table->string('action_type', 60)->comment('task_created, task_updated, time_logged, etc.');
            $table->string('entity_type', 60)->comment('task, role, review, etc.');
            $table->unsignedBigInteger('entity_id');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'entity_type', 'entity_id']);
            $table->index(['tenant_id', 'user_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('es_activity_logs'); }
};
