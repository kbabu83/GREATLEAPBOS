<?php

namespace Database\Seeders;

use App\Models\AttendancePolicy;
use App\Models\Branch;
use App\Models\ComplianceSetting;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Employee;
use App\Models\LeavePolicy;
use App\Models\LeaveType;
use App\Models\OrganisationSetting;
use App\Models\PayrollPolicy;
use App\Models\SalaryComponent;
use App\Models\SalaryStructure;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->dropOrphanedTenantDatabases();

        // ── Central super-admin ───────────────────────────────────────────────
        User::create([
            'name'      => 'Super Admin',
            'email'     => 'admin@greatleap.app',
            'password'  => Hash::make('password'),
            'role'      => User::ROLE_SUPER_ADMIN,
            'is_active' => true,
        ]);

        // ── Demo tenants ──────────────────────────────────────────────────────
        $this->createTenant('acme',      'Acme Corporation', 'admin@acme.com',      'professional', 'Technology');
        $this->createTenant('techstart', 'TechStart Inc',    'admin@techstart.com', 'starter',      'Technology');
        $this->createTenant('globalco',  'Global Co',        'admin@globalco.com',  'enterprise',   'Manufacturing');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function dropOrphanedTenantDatabases(): void
    {
        $prefix        = config('tenancy.database.prefix', 'tenant_');
        $escapedPrefix = str_replace('_', '\\_', $prefix);
        $databases     = DB::select("SHOW DATABASES LIKE '{$escapedPrefix}%'");
        foreach ($databases as $row) {
            $dbName = array_values((array) $row)[0];
            DB::statement("DROP DATABASE IF EXISTS `{$dbName}`");
            $this->command?->getOutput()?->writeln("  Dropped: <comment>{$dbName}</comment>");
        }
    }

    private function createTenant(string $slug, string $name, string $adminEmail, string $plan, string $industry): void
    {
        // 1. Create tenant record (triggers CreateDatabase + MigrateDatabase via TenancyServiceProvider)
        $tenant = Tenant::create([
            'id'     => $slug,
            'name'   => $name,
            'email'  => $adminEmail,
            'plan'   => $plan,
            'status' => Tenant::STATUS_ACTIVE,
        ]);

        $tenant->domains()->create([
            'domain' => $slug . '.' . env('CENTRAL_DOMAIN', 'localhost'),
        ]);

        // 2. Organisation settings
        OrganisationSetting::create([
            'tenant_id'             => $slug,
            'legal_name'            => $name,
            'trade_name'            => $name,
            'industry'              => $industry,
            'company_size'          => 'small',
            'email'                 => $adminEmail,
            'phone'                 => '+91 98765 43210',
            'address_line1'         => '123 Business Park',
            'city'                  => 'Bengaluru',
            'state'                 => 'Karnataka',
            'country'               => 'India',
            'pincode'               => '560001',
            'timezone'              => 'Asia/Kolkata',
            'currency'              => 'INR',
            'financial_year_start_month' => 4,
            'employee_id_prefix'    => strtoupper(substr($slug, 0, 3)),
            'employee_id_next_number' => 1,
        ]);

        // 3. Branches
        $hq = Branch::create([
            'tenant_id'     => $slug,
            'name'          => 'Head Office',
            'code'          => 'HQ',
            'is_head_office'=> true,
            'city'          => 'Bengaluru',
            'state'         => 'Karnataka',
            'country'       => 'India',
            'is_active'     => true,
        ]);

        // 4. Departments
        $hrDept  = Department::create(['tenant_id' => $slug, 'name' => 'Human Resources', 'code' => 'HR',  'is_active' => true]);
        $engDept = Department::create(['tenant_id' => $slug, 'name' => 'Engineering',     'code' => 'ENG', 'is_active' => true]);
        $finDept = Department::create(['tenant_id' => $slug, 'name' => 'Finance',         'code' => 'FIN', 'is_active' => true]);

        // 5. Designations
        $hrMgr   = Designation::create(['tenant_id' => $slug, 'title' => 'HR Manager',          'code' => 'HRM',  'department_id' => $hrDept->id,  'level' => 5, 'is_active' => true]);
        $swe     = Designation::create(['tenant_id' => $slug, 'title' => 'Software Engineer',   'code' => 'SWE',  'department_id' => $engDept->id, 'level' => 2, 'is_active' => true]);
        $senSwe  = Designation::create(['tenant_id' => $slug, 'title' => 'Senior Engineer',     'code' => 'SSWE', 'department_id' => $engDept->id, 'level' => 3, 'is_active' => true]);
        $finAna  = Designation::create(['tenant_id' => $slug, 'title' => 'Finance Analyst',     'code' => 'FIN',  'department_id' => $finDept->id, 'level' => 2, 'is_active' => true]);

        // 6. Policies — Attendance
        AttendancePolicy::create([
            'tenant_id'              => $slug,
            'name'                   => 'Standard 9-6',
            'is_default'             => true,
            'work_hours_per_day'     => 8,
            'work_days_per_week'     => 5,
            'work_start_time'        => '09:00:00',
            'work_end_time'          => '18:00:00',
            'grace_period_minutes'   => 15,
            'half_day_hours'         => 4,
            'cycle_type'             => 'calendar_month',
            'week_off_days'          => [0, 6],  // Sun, Sat
            'min_hours_for_present'  => 4,
            'late_deduction_applicable' => false,
            'overtime_applicable'    => false,
            'is_active'              => true,
        ]);

        // 7. Leave Policy
        $leavePolicy = LeavePolicy::create([
            'tenant_id'          => $slug,
            'name'               => 'Standard Leave Policy',
            'is_default'         => true,
            'carry_forward_enabled' => true,
            'carry_forward_month'   => 4,
            'is_active'          => true,
        ]);

        $leaveTypes = [
            ['name' => 'Casual Leave',   'code' => 'CL',  'days_per_year' => 12, 'color' => '#3B82F6', 'is_paid' => true,  'carry_forward' => false, 'allow_half_day' => true],
            ['name' => 'Sick Leave',     'code' => 'SL',  'days_per_year' => 7,  'color' => '#EF4444', 'is_paid' => true,  'carry_forward' => false, 'allow_half_day' => true,  'requires_document' => true, 'document_required_after_days' => 3],
            ['name' => 'Earned Leave',   'code' => 'EL',  'days_per_year' => 15, 'color' => '#10B981', 'is_paid' => true,  'carry_forward' => true,  'max_carry_forward_days' => 30, 'encashable' => true],
            ['name' => 'Loss of Pay',    'code' => 'LOP', 'days_per_year' => 0,  'color' => '#6B7280', 'is_paid' => false, 'carry_forward' => false],
            ['name' => 'Maternity Leave','code' => 'ML',  'days_per_year' => 182,'color' => '#EC4899', 'is_paid' => true,  'carry_forward' => false, 'gender_restriction' => 'female', 'advance_notice_days' => 30],
        ];

        foreach ($leaveTypes as $lt) {
            LeaveType::create(array_merge([
                'tenant_id'       => $slug,
                'leave_policy_id' => $leavePolicy->id,
                'min_days'        => 0.5,
                'is_active'       => true,
                'gender_restriction'     => 'none',
                'applicable_after_days'  => 0,
                'advance_notice_days'    => 0,
                'requires_document'      => false,
                'document_required_after_days' => 3,
                'allow_half_day'  => true,
                'encashable'      => false,
                'carry_forward'   => false,
            ], $lt));
        }

        // 8. Payroll Policy (attendance cycle 25th-24th, payroll 1st-30th)
        PayrollPolicy::create([
            'tenant_id'                    => $slug,
            'name'                         => 'Monthly Payroll (25th–24th Attendance)',
            'is_default'                   => true,
            'attendance_cycle_type'        => 'custom',
            'attendance_cycle_start_day'   => 25,
            'payroll_cycle_type'           => 'calendar_month',
            'payroll_cycle_start_day'      => 1,
            'payment_frequency'            => 'monthly',
            'payment_day'                  => 28,
            'working_days_basis'           => 'fixed_26',
            'lop_applicable'               => true,
            'lop_deduction_basis'          => 'per_day',
            'block_on_missing_bank_details'=> true,
            'block_on_missing_attendance'  => false,
            'block_on_missing_pan'         => false,
            'block_on_missing_uan'         => false,
            'include_arrears'              => true,
            'is_active'                    => true,
        ]);

        // 9. Salary Structure — Standard
        $structure = SalaryStructure::create([
            'tenant_id'   => $slug,
            'name'        => 'Standard CTC',
            'description' => 'Default salary structure for monthly-salaried employees',
            'is_active'   => true,
        ]);

        $components = [
            ['name' => 'Basic Pay',            'code' => 'BASIC',   'type' => 'earning',              'calculation_type' => 'percentage_of_gross', 'value' => 40,    'is_taxable' => true,  'is_pf_applicable' => true,  'is_esi_applicable' => true,  'display_order' => 1],
            ['name' => 'House Rent Allowance', 'code' => 'HRA',     'type' => 'earning',              'calculation_type' => 'percentage_of_basic', 'value' => 40,    'is_taxable' => true,  'is_pf_applicable' => false, 'is_esi_applicable' => true,  'display_order' => 2],
            ['name' => 'Travel Allowance',     'code' => 'TA',      'type' => 'earning',              'calculation_type' => 'fixed',               'value' => 1600,  'is_taxable' => false, 'is_pf_applicable' => false, 'is_esi_applicable' => false, 'display_order' => 3],
            ['name' => 'Special Allowance',    'code' => 'SPEC',    'type' => 'earning',              'calculation_type' => 'percentage_of_gross', 'value' => 10,    'is_taxable' => true,  'is_pf_applicable' => false, 'is_esi_applicable' => true,  'display_order' => 4],
            ['name' => 'PF Employee',          'code' => 'PF_EMP',  'type' => 'deduction',            'calculation_type' => 'percentage_of_basic', 'value' => 12,    'is_taxable' => false, 'is_pf_applicable' => true,  'is_esi_applicable' => false, 'display_order' => 5],
            ['name' => 'ESI Employee',         'code' => 'ESI_EMP', 'type' => 'deduction',            'calculation_type' => 'percentage_of_gross', 'value' => 0.75,  'is_taxable' => false, 'is_pf_applicable' => false, 'is_esi_applicable' => true,  'display_order' => 6],
            ['name' => 'PF Employer',          'code' => 'PF_ER',   'type' => 'employer_contribution','calculation_type' => 'percentage_of_basic', 'value' => 12,    'is_taxable' => false, 'is_pf_applicable' => true,  'is_esi_applicable' => false, 'display_order' => 1],
            ['name' => 'ESI Employer',         'code' => 'ESI_ER',  'type' => 'employer_contribution','calculation_type' => 'percentage_of_gross', 'value' => 3.25,  'is_taxable' => false, 'is_pf_applicable' => false, 'is_esi_applicable' => true,  'display_order' => 2],
        ];

        foreach ($components as $c) {
            SalaryComponent::create(array_merge(['tenant_id' => $slug, 'salary_structure_id' => $structure->id], $c));
        }

        // 10. Compliance Settings
        ComplianceSetting::create([
            'tenant_id'              => $slug,
            'pf_applicable'          => true,
            'pf_employee_rate'       => 12,
            'pf_employer_rate'       => 12,
            'pf_wage_ceiling'        => 15000,
            'esi_applicable'         => true,
            'esi_employee_rate'      => 0.75,
            'esi_employer_rate'      => 3.25,
            'esi_wage_ceiling'       => 21000,
            'pt_applicable'          => true,
            'pt_state'               => 'Karnataka',
            'pt_slabs'               => [
                ['from' => 0,     'to' => 14999, 'amount' => 0],
                ['from' => 15000, 'to' => null,  'amount' => 200],
            ],
            'tds_applicable'         => true,
            'tds_regime'             => 'new',
            'gratuity_applicable'    => true,
            'gratuity_rate'          => 4.81,
        ]);

        // 11. Portal users (central DB, scoped by tenant_id)
        User::create([
            'name'      => "{$name} Admin",
            'email'     => $adminEmail,
            'password'  => Hash::make('password'),
            'role'      => User::ROLE_TENANT_ADMIN,
            'tenant_id' => $slug,
            'is_active' => true,
        ]);

        foreach ([1, 2, 3] as $i) {
            User::create([
                'name'      => "Staff User {$i}",
                'email'     => "staff{$i}@{$slug}.com",
                'password'  => Hash::make('password'),
                'role'      => User::ROLE_STAFF,
                'tenant_id' => $slug,
                'is_active' => true,
            ]);
        }

        // 12. Sample employees (linked to portal user for admin)
        $adminUser = User::where('email', $adminEmail)->first();

        $hrEmployee = Employee::create([
            'tenant_id'         => $slug,
            'employee_code'     => strtoupper(substr($slug, 0, 3)) . '0001',
            'user_id'           => $adminUser->id,
            'first_name'        => 'Priya',
            'last_name'         => 'Sharma',
            'work_email'        => $adminEmail,
            'phone'             => '+91 98765 43210',
            'date_of_birth'     => '1990-05-15',
            'gender'            => 'female',
            'department_id'     => $hrDept->id,
            'designation_id'    => $hrMgr->id,
            'branch_id'         => $hq->id,
            'employment_type'   => 'monthly_salaried',
            'employment_status' => 'active',
            'date_of_joining'   => '2022-01-01',
            'date_of_confirmation' => '2022-04-01',
            'work_location_type'=> 'office',
            'pan_number'        => 'ABCDE1234F',
            'bank_account_number' => '1234567890',
            'bank_name'         => 'HDFC Bank',
            'bank_ifsc'         => 'HDFC0001234',
            'is_active'         => true,
            'onboarding_completed_at' => now(),
        ]);

        Employee::create([
            'tenant_id'         => $slug,
            'employee_code'     => strtoupper(substr($slug, 0, 3)) . '0002',
            'first_name'        => 'Rahul',
            'last_name'         => 'Verma',
            'work_email'        => "rahul@{$slug}.com",
            'phone'             => '+91 87654 32109',
            'date_of_birth'     => '1995-08-20',
            'gender'            => 'male',
            'department_id'     => $engDept->id,
            'designation_id'    => $swe->id,
            'branch_id'         => $hq->id,
            'reporting_manager_id' => $hrEmployee->id,
            'employment_type'   => 'monthly_salaried',
            'employment_status' => 'active',
            'date_of_joining'   => '2023-03-15',
            'work_location_type'=> 'hybrid',
            'is_active'         => true,
        ]);

        Employee::create([
            'tenant_id'         => $slug,
            'employee_code'     => strtoupper(substr($slug, 0, 3)) . '0003',
            'first_name'        => 'Anita',
            'last_name'         => 'Nair',
            'work_email'        => "anita@{$slug}.com",
            'phone'             => '+91 76543 21098',
            'date_of_birth'     => '1988-12-01',
            'gender'            => 'female',
            'department_id'     => $finDept->id,
            'designation_id'    => $finAna->id,
            'branch_id'         => $hq->id,
            'employment_type'   => 'monthly_salaried',
            'employment_status' => 'probation',
            'date_of_joining'   => now()->subMonths(2)->toDateString(),
            'date_of_confirmation' => now()->addMonths(1)->toDateString(),
            'work_location_type'=> 'office',
            'is_active'         => true,
        ]);

        // Update employee_id_next_number to account for seeded employees
        OrganisationSetting::where('tenant_id', $slug)->update(['employee_id_next_number' => 4]);
    }
}
