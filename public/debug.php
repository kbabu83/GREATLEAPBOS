<?php
/**
 * Standalone Debug Script
 * Use this to clear Laravel caches when the main app is 500ing or 404ing.
 */

define('LARAVEL_START', microtime(true));

// 1. Basic Web Server Test
echo "<h1>Diagnostic Tool</h1>";
echo "<p>Web server is executing PHP correctly.</p>";
echo "<p>Time: " . date('Y-m-d H:i:s') . "</p>";

// 2. Try to boot Laravel to clear cache
try {
    require __DIR__.'/../vendor/autoload.php';
    $app = require_once __DIR__.'/../bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

    echo "<h3>Attempting to clear Laravel Caches...</h3>";
    
    // Clear everything
    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
    echo "<pre>" . \Illuminate\Support\Facades\Artisan::output() . "</pre>";
    
    echo "<p style='color: green;'><b>SUCCESS:</b> Laravel cache cleared successfully.</p>";
    echo "<p>Now try visiting <a href='/api/ping'>/api/ping</a> to see if it works.</p>";

} catch (Exception $e) {
    echo "<h3 style='color: red;'>CRITICAL ERROR during Laravel Boot:</h3>";
    echo "<p><b>Message:</b> " . $e->getMessage() . "</p>";
    echo "<p><b>File:</b> " . $e->getFile() . "</p>";
    echo "<p><b>Line:</b> " . $e->getLine() . "</p>";
    echo "<h4>Stack Trace:</h4>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

// 3. Environment Check
echo "<h3>Remote Environment Check</h3>";
echo "<ul>";
echo "<li>PHP Version: " . PHP_VERSION . "</li>";
echo "<li>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</li>";
echo "<li>Script Path: " . __FILE__ . "</li>";
echo "<li>.env exists: " . (file_exists(__DIR__.'/../.env') ? 'Yes' : 'No') . "</li>";
echo "</ul>";
