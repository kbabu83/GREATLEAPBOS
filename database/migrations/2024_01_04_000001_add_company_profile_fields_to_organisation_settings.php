<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organisation_settings', function (Blueprint $table) {
            $table->string('tagline')->nullable()->after('trade_name');
            $table->text('about')->nullable()->after('tagline');
            $table->text('vision')->nullable()->after('about');
            $table->text('mission')->nullable()->after('vision');
            $table->json('core_values')->nullable()->after('mission');    // [{title, description}]
            $table->json('products')->nullable()->after('core_values');   // [{name, description, category}]
            $table->json('services')->nullable()->after('products');      // [{name, description}]
            $table->json('major_clients')->nullable()->after('services'); // [{name, industry, note}]
            $table->text('quality_policy')->nullable()->after('major_clients');
            $table->json('company_goals')->nullable()->after('quality_policy');  // [{goal, target, timeframe}]
            $table->json('key_processes')->nullable()->after('company_goals');   // [{title, description}]
        });
    }

    public function down(): void
    {
        Schema::table('organisation_settings', function (Blueprint $table) {
            $table->dropColumn([
                'tagline', 'about', 'vision', 'mission', 'core_values',
                'products', 'services', 'major_clients',
                'quality_policy', 'company_goals', 'key_processes',
            ]);
        });
    }
};
