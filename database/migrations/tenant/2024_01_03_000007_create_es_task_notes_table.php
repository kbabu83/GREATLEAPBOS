<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('es_task_notes', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36)->index();
            $table->unsignedBigInteger('task_id');
            $table->unsignedBigInteger('user_id');
            $table->text('note');
            $table->timestamps();
            $table->foreign('task_id')->references('id')->on('es_tasks')->cascadeOnDelete();
            $table->index(['tenant_id', 'task_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('es_task_notes'); }
};
