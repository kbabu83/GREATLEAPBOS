<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_es_roles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('es_role_id');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('es_role_id')->references('id')->on('es_roles')->onDelete('cascade');
            $table->unique(['user_id', 'es_role_id']);
        });

        // Migrate existing single es_role_id assignments into the pivot
        DB::statement('
            INSERT INTO user_es_roles (user_id, es_role_id, created_at, updated_at)
            SELECT id, es_role_id, NOW(), NOW()
            FROM users
            WHERE es_role_id IS NOT NULL
        ');

        // Drop the old column
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['es_role_id']);
            $table->dropColumn('es_role_id');
        });
    }

    public function down(): void
    {
        // Re-add the column (restored to first assignment only)
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('es_role_id')->nullable()->after('department');
            $table->foreign('es_role_id')->references('id')->on('es_roles')->nullOnDelete();
        });

        DB::statement('
            UPDATE users u
            JOIN (
                SELECT user_id, MIN(es_role_id) AS es_role_id FROM user_es_roles GROUP BY user_id
            ) pivot ON u.id = pivot.user_id
            SET u.es_role_id = pivot.es_role_id
        ');

        Schema::dropIfExists('user_es_roles');
    }
};
