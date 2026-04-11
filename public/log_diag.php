<?php
/**
 * Standalone Log Diagnostic Script
 * Bypasses Laravel routing to retrieve the latest error logs.
 */

$logPath = __DIR__ . '/../storage/logs/laravel.log';

header('Content-Type: text/plain');

if (!file_exists($logPath)) {
    echo "ERROR: Log file not found at: " . realpath($logPath) . "\n";
    echo "Current directory: " . __DIR__ . "\n";
    echo "Parent directory contents:\n";
    print_r(scandir(__DIR__ . '/..'));
    exit;
}

echo "Last 5000 lines of Laravel Log:\n";
echo "===============================\n\n";

// Use tail-like approach to read the end of the file
$handle = fopen($logPath, "r");
fseek($handle, -50000, SEEK_END); // Read roughly last 50KB
while (!feof($handle)) {
    echo fgets($handle);
}
fclose($handle);
