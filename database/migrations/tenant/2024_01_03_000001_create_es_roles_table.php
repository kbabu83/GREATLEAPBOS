<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('es_roles', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36)->index();
            $table->string('name');
            $table->text('purpose')->nullable();
            $table->unsignedBigInteger('reporting_role_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('reporting_role_id')->references('id')->on('es_roles')->nullOnDelete();
            $table->index(['tenant_id', 'is_active']);
        });
    }
    public function down(): void { Schema::dropIfExists('es_roles'); }
};
