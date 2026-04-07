<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class DiagnoseTenantDatabases extends Command
{
    protected $signature = 'diagnose:tenants {--verbose}';
    protected $description = 'Diagnose state of all tenant databases';

    public function handle()
    {
        $this->info('╔════════════════════════════════════════════════════════════════╗');
        $this->info('║     Great Leap App - Tenant Database Diagnostic                 ║');
        $this->info('╚════════════════════════════════════════════════════════════════╝');
        $this->newLine();

        // Step 1: Check tenants in central database
        $this->info('STEP 1: Checking Central Database for Tenant Records');
        $this->line('─────────────────────────────────────────────────────────────────');

        $tenants = Tenant::all();

        if ($tenants->isEmpty()) {
            $this->warn('⚠️  No tenants found in central database');
            return;
        }

        $this->info("✅ Found " . $tenants->count() . " tenant(s) in central database");
        $this->newLine();

        // Step 2: For each tenant, check if database exists and has tables
        $this->info('STEP 2: Checking Tenant Database State');
        $this->line('─────────────────────────────────────────────────────────────────');
        $this->newLine();

        $issues = [];

        foreach ($tenants as $tenant) {
            $dbName = "tenant_{$tenant->id}";

            $this->line("Tenant: {$tenant->name} (ID: {$tenant->id})");
            $this->line("  Email: {$tenant->email}");
            $this->line("  Status: {$tenant->status}");

            // Check if database exists
            try {
                $databases = DB::select("SHOW DATABASES LIKE ?", ["%$dbName%"]);

                if (empty($databases)) {
                    $this->error("  ❌ Database does NOT exist: $dbName");
                    $issues[] = [
                        'tenant' => $tenant->name,
                        'issue' => "Database $dbName is missing",
                        'cause' => 'Tenant creation failed or database was deleted',
                        'solution' => 'Recreate tenant database and run migrations'
                    ];
                } else {
                    $this->info("  ✅ Database exists: $dbName");

                    // Check if users table exists
                    $this->checkTenantTable($dbName, $tenant);
                }
            } catch (\Exception $e) {
                $this->error("  ❌ Error checking database: " . $e->getMessage());
                $issues[] = [
                    'tenant' => $tenant->name,
                    'issue' => 'Database connection failed',
                    'cause' => $e->getMessage(),
                    'solution' => 'Check MySQL is running and permissions are correct'
                ];
            }

            $this->newLine();
        }

        // Step 3: Summary
        $this->info('STEP 3: Issues Summary');
        $this->line('─────────────────────────────────────────────────────────────────');
        $this->newLine();

        if (empty($issues)) {
            $this->info('✅ All tenant databases appear to be in good state!');
            $this->newLine();
            $this->info('Next step: Check application logs for the actual error');
            $this->info('Run: tail -50 storage/logs/laravel.log');
        } else {
            $this->warn('⚠️  Found ' . count($issues) . ' issue(s):');
            $this->newLine();

            foreach ($issues as $issue) {
                $this->warn("Tenant: {$issue['tenant']}");
                $this->line("  Issue: {$issue['issue']}");
                $this->line("  Cause: {$issue['cause']}");
                $this->line("  Solution: {$issue['solution']}");
                $this->newLine();
            }
        }
    }

    private function checkTenantTable($dbName, $tenant)
    {
        try {
            // Check if users table exists
            $tables = DB::select("SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA=?", [$dbName]);

            if ($tables[0]->cnt == 0) {
                $this->error("  ❌ Database is EMPTY (no tables) - migrations not run");
                return;
            }

            $this->info("  ✅ Database has tables");

            // Check for users table
            $usersTableExists = DB::select(
                "SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME='users'",
                [$dbName]
            );

            if ($usersTableExists[0]->cnt == 0) {
                $this->error("  ❌ 'users' table missing from {$dbName}");
                $this->line("     Problem: Migrations incomplete");
                return;
            }

            // Check for admin user
            tenancy()->initialize($tenant);

            $adminCount = \App\Models\User::where('role', 'tenant_admin')->count();

            if ($adminCount == 0) {
                $this->error("  ❌ No admin user found in tenant database");
                $this->line("     Problem: Admin user not created in tenant");
            } else {
                $this->info("  ✅ Admin user exists in tenant database");
                $adminUser = \App\Models\User::where('role', 'tenant_admin')->first();
                $this->line("     Admin: {$adminUser->name} ({$adminUser->email})");
            }

            tenancy()->end();

        } catch (\Exception $e) {
            $this->error("  ❌ Error checking tables: " . $e->getMessage());
        }
    }
}
