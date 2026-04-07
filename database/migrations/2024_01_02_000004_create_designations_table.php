<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('designations', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->string('title');                        // Software Engineer, HR Manager
            $table->string('code', 20)->nullable();         // SWE, HRM
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedTinyInteger('level')->default(1); // 1=Jr, 2=Mid, 3=Sr, 4=Lead, 5=Mgr, 6=Dir, 7=VP, 8=C-Suite
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            $table->unique(['tenant_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('designations');
    }
};
