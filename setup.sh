#!/bin/bash
# Great Leap App - Setup Script
# Run this after cloning the repository

set -e

echo "🚀 Setting up Great Leap App..."

# 1. Install PHP dependencies
echo "📦 Installing PHP dependencies..."
composer install

# 2. Install Node dependencies
echo "📦 Installing Node dependencies..."
npm install

# 3. Copy environment file
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    cp .env.example .env
    php artisan key:generate
fi

# 4. Prompt for database credentials
echo ""
echo "🗄️  Database Setup"
echo "Please ensure MySQL is running and update .env with your credentials:"
echo "  DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD"
echo ""
read -p "Press Enter when ready to run migrations..."

# 5. Run central database migrations
echo "🔄 Running central database migrations..."
php artisan migrate

# 6. Seed the database
echo "🌱 Seeding database with demo data..."
php artisan db:seed

# 7. Add local hosts entries
echo ""
echo "📝 Add these lines to your /etc/hosts file:"
echo "  127.0.0.1  greatlap.local"
echo "  127.0.0.1  acme.greatlap.local"
echo "  127.0.0.1  techstart.greatlap.local"
echo "  127.0.0.1  globalco.greatlap.local"
echo ""

# 8. Build frontend assets
echo "🏗️  Building frontend assets..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Access the app:"
echo "  Central admin:   http://greatlap.local:8000"
echo "  Acme tenant:     http://acme.greatlap.local:8000"
echo "  TechStart tenant: http://techstart.greatlap.local:8000"
echo ""
echo "🔑 Demo credentials:"
echo "  Super Admin: admin@greatleap.app / password"
echo "  Tenant Admin: admin@acme.com / password"
echo ""
echo "🚀 Start the dev server:"
echo "  php artisan serve --host=greatlap.local"
echo "  npm run dev  (in another terminal)"
