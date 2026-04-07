<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->string('name');
            $table->string('code', 20)->nullable();         // HR, FIN, ENG
            $table->text('description')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();  // sub-departments
            $table->unsignedBigInteger('head_employee_id')->nullable(); // dept head
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('departments')->nullOnDelete();
            $table->unique(['tenant_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
