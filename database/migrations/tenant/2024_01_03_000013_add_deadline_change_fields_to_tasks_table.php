<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('es_tasks', function (Blueprint $table) {
            $table->dateTime('deadline_change_requested_at')->nullable()->after('completed_at');
            $table->dateTime('requested_new_due_date')->nullable()->after('deadline_change_requested_at');
            $table->text('deadline_change_reason')->nullable()->after('requested_new_due_date');
            $table->enum('deadline_change_status', ['pending', 'approved', 'rejected'])->nullable()->after('deadline_change_reason');
            $table->dateTime('deadline_change_reviewed_at')->nullable()->after('deadline_change_status');
            $table->unsignedBigInteger('deadline_change_reviewed_by')->nullable()->after('deadline_change_reviewed_at');
            $table->foreign('deadline_change_reviewed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('es_tasks', function (Blueprint $table) {
            $table->dropForeign(['deadline_change_reviewed_by']);
            $table->dropColumn([
                'deadline_change_requested_at',
                'requested_new_due_date',
                'deadline_change_reason',
                'deadline_change_status',
                'deadline_change_reviewed_at',
                'deadline_change_reviewed_by',
            ]);
        });
    }
};
