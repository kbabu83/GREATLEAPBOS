<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Great Leap App') }}</title>

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
            appName: "{{ config('app.name') }}",
            appUrl: "{{ config('app.url') }}",
            centralDomain: "{{ env('CENTRAL_DOMAIN', 'greatlap.local') }}",
            @if(tenancy()->initialized)
            tenantId: "{{ tenant('id') }}",
            tenantName: "{{ tenant('name') }}",
            isTenant: true,
            @else
            isTenant: false,
            @endif
        };
    </script>
</head>
<body class="antialiased bg-gray-50 dark:bg-slate-950">
    <div id="app"></div>
</body>
</html>
