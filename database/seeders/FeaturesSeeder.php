<?php

namespace Database\Seeders;

use App\Models\Central\Feature;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FeaturesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $features = [
            // 1. Advanced Analytics
            [
                'id' => (string) Str::uuid(),
                'name' => 'Advanced Analytics',
                'slug' => 'advanced-analytics',
                'category' => 'Analytics',
                'icon' => '📊',
                'description' => 'Access advanced analytics dashboard, data visualization, and custom metrics',
                'is_active' => true,
            ],
            // 2. Custom Reports
            [
                'id' => (string) Str::uuid(),
                'name' => 'Custom Reports',
                'slug' => 'custom-reports',
                'category' => 'Analytics',
                'icon' => '📄',
                'description' => 'Build custom reports, schedule automated reports, export to PDF/Excel',
                'is_active' => true,
            ],
            // 3. Audit Logs
            [
                'id' => (string) Str::uuid(),
                'name' => 'Audit Logs',
                'slug' => 'audit-logs',
                'category' => 'Security',
                'icon' => '🔍',
                'description' => 'Complete activity logs for compliance, user actions, data changes',
                'is_active' => true,
            ],
            // 4. Team Collaboration
            [
                'id' => (string) Str::uuid(),
                'name' => 'Team Collaboration',
                'slug' => 'team-collaboration',
                'category' => 'Collaboration',
                'icon' => '👥',
                'description' => 'Team workspaces, shared tasks, comments, mentions',
                'is_active' => true,
            ],
            // 5. Unlimited Users
            [
                'id' => (string) Str::uuid(),
                'name' => 'Unlimited Users',
                'slug' => 'unlimited-users',
                'category' => 'Users',
                'icon' => '∞',
                'description' => 'Add unlimited team members (free plan limited to 5 users)',
                'is_active' => true,
            ],
            // 6. Advanced Permissions
            [
                'id' => (string) Str::uuid(),
                'name' => 'Advanced Permissions',
                'slug' => 'advanced-permissions',
                'category' => 'Security',
                'icon' => '🔐',
                'description' => 'Create custom roles, granular permissions, department-level access control',
                'is_active' => true,
            ],
            // 7. API Access
            [
                'id' => (string) Str::uuid(),
                'name' => 'API Access',
                'slug' => 'api-access',
                'category' => 'Integrations',
                'icon' => '⚙️',
                'description' => 'REST API access, webhook support, integration with third-party tools',
                'is_active' => true,
            ],
            // 8. SSO Integration
            [
                'id' => (string) Str::uuid(),
                'name' => 'SSO Integration',
                'slug' => 'sso-integration',
                'category' => 'Security',
                'icon' => '🔑',
                'description' => 'Single Sign-On (SAML, OAuth), enterprise authentication',
                'is_active' => true,
            ],
            // 9. Custom Branding
            [
                'id' => (string) Str::uuid(),
                'name' => 'Custom Branding',
                'slug' => 'custom-branding',
                'category' => 'Customization',
                'icon' => '🎨',
                'description' => 'White-label solution, custom domain, branded emails, custom logo',
                'is_active' => true,
            ],
            // 10. Mobile App Access
            [
                'id' => (string) Str::uuid(),
                'name' => 'Mobile App Access',
                'slug' => 'mobile-app',
                'category' => 'Mobile',
                'icon' => '📱',
                'description' => 'Access Great Leap via native mobile apps (iOS & Android)',
                'is_active' => true,
            ],
        ];

        foreach ($features as $feature) {
            Feature::firstOrCreate(
                ['slug' => $feature['slug']],
                $feature
            );
        }

        $this->command->info('✓ 10 Features seeded successfully!');
    }
}
