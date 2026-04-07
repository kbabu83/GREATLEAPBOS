<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title><?php echo e(config('app.name', 'Great Leap App')); ?></title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">

    <!-- Scripts -->
    <link rel="stylesheet" href="/build/assets/app-LRfy2Xx5.css">
    <script type="module" src="/build/assets/app-MDUaXMed.js"></script>

    <!-- Tenant/App Config -->
    <script>
        window.__APP_CONFIG__ = {
            appName: "<?php echo e(config('app.name')); ?>",
            appUrl: "<?php echo e(config('app.url')); ?>",
            centralDomain: "<?php echo e(env('CENTRAL_DOMAIN', 'greatlap.local')); ?>",
            <?php if(tenancy()->initialized): ?>
            tenantId: "<?php echo e(tenant('id')); ?>",
            tenantName: "<?php echo e(tenant('name')); ?>",
            isTenant: true,
            <?php else: ?>
            isTenant: false,
            <?php endif; ?>
        };
    </script>
</head>
<body class="antialiased bg-gray-50 dark:bg-slate-950">
    <div id="app"></div>
</body>
</html>
<?php /**PATH /var/www/new-great-leap-app/resources/views/app.blade.php ENDPATH**/ ?>