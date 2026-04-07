<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('es_role_skills', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36)->index();
            $table->unsignedBigInteger('role_id')->unique();
            $table->json('hard_skills')->nullable();
            $table->json('soft_skills')->nullable();
            $table->timestamps();
            $table->foreign('role_id')->references('id')->on('es_roles')->cascadeOnDelete();
        });

        Schema::create('es_role_ideal_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36)->index();
            $table->unsignedBigInteger('role_id')->unique();
            $table->text('education')->nullable();
            $table->string('experience_range')->nullable()->comment('e.g. 3-5 years');
            $table->text('additional_requirements')->nullable();
            $table->timestamps();
            $table->foreign('role_id')->references('id')->on('es_roles')->cascadeOnDelete();
        });

        Schema::create('es_role_performance_definitions', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36)->index();
            $table->unsignedBigInteger('role_id')->unique();
            $table->text('excellent_definition')->nullable();
            $table->text('average_definition')->nullable();
            $table->text('poor_definition')->nullable();
            $table->timestamps();
            $table->foreign('role_id')->references('id')->on('es_roles')->cascadeOnDelete();
        });
    }
    public function down(): void {
        Schema::dropIfExists('es_role_performance_definitions');
        Schema::dropIfExists('es_role_ideal_profiles');
        Schema::dropIfExists('es_role_skills');
    }
};
