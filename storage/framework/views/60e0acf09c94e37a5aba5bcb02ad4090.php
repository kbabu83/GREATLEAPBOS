<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Great Leap App</title>
    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/js/app.jsx']); ?>
</head>
<body>
    <div id="app"></div>
</body>
</html>
<?php /**PATH /var/www/new-great-leap-app/resources/views/welcome.blade.php ENDPATH**/ ?>