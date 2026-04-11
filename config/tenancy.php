<?php

declare(strict_types=1);

return [
    'tenant_model' => \App\Models\Tenant::class,
    'id_generator'  => \Stancl\Tenancy\UUIDGenerator::class,

    'domain_model' => \App\Models\Domain::class,

    /**
     * Central domains — requests on these will NOT be treated as tenant requests.
     */
    'central_domains' => [
        env('CENTRAL_DOMAIN', 'greatlap.local'),
        '168.144.67.229',
        'localhost',
        '127.0.0.1',
    ],

    /**
     * Bootstrappers run when tenancy is initialized.
     */
    'bootstrappers' => [
        Stancl\Tenancy\Bootstrappers\DatabaseTenancyBootstrapper::class,
        Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class,
        Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper::class,
        Stancl\Tenancy\Bootstrappers\QueueTenancyBootstrapper::class,
    ],

    /**
     * Database tenancy config — used by DatabaseTenancyBootstrapper.
     */
    'database' => [
        'central_connection' => env('DB_CONNECTION', 'mysql'),
        'template_connection' => null,

        // Tenant DB names: prefix + tenant_id
        'prefix' => env('TENANCY_DB_PREFIX', 'tenant_'),
        'suffix' => '',

        // v3.10 — namespace is Stancl\Tenancy\TenantDatabaseManagers (no Database\ prefix)
        'managers' => [
            'mysql'  => \Stancl\Tenancy\TenantDatabaseManagers\MySQLDatabaseManager::class,
            'pgsql'  => \Stancl\Tenancy\TenantDatabaseManagers\PostgreSQLDatabaseManager::class,
            'sqlite' => \Stancl\Tenancy\TenantDatabaseManagers\SQLiteDatabaseManager::class,
        ],
    ],

    /**
     * Cache tenancy config.
     */
    'cache' => [
        'tag' => 'tenant',
    ],

    /**
     * Filesystem tenancy config.
     */
    'filesystem' => [
        'suffix_base' => 'tenant',
        'disks' => [
            'local',
            'public',
        ],
        'root_override' => [],
    ],

    /**
     * Features / add-ons.
     */
    'features' => [
        Stancl\Tenancy\Features\UserImpersonation::class,
        Stancl\Tenancy\Features\TelescopeTags::class,
        Stancl\Tenancy\Features\UniversalRoutes::class,
    ],

    'routes' => true,
    'parameters' => [],

    'migration_parameters' => [
        '--force'    => true,
        '--path'     => [database_path('migrations/tenant')],
        '--realpath' => true,
    ],

    'seeder_parameters' => [
        '--class' => 'Database\Seeders\TenantDatabaseSeeder',
        '--force' => true,
    ],
];
