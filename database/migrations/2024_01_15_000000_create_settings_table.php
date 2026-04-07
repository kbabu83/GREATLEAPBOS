<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('central')->create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'razorpay.key_id'
            $table->longText('value')->nullable(); // Encrypted for sensitive data
            $table->string('section')->default('general'); // razorpay, email, general, etc.
            $table->string('type')->default('text'); // text, password, number, boolean, json
            $table->string('label'); // Display label
            $table->longText('description')->nullable(); // Help text
            $table->boolean('is_encrypted')->default(false); // Whether value is encrypted
            $table->integer('order')->default(0); // Display order
            $table->timestamps();
            
            $table->index('section');
            $table->index('key');
        });
    }

    public function down(): void
    {
        Schema::connection('central')->dropIfExists('settings');
    }
};
