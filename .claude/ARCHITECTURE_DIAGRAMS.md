# Architecture Diagrams

## 1. LOCAL DEVELOPMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOCAL MACHINE (macOS)                       │
│                    Docker Compose Environment                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  BROWSER (http://localhost:8000)                                 │
│  - Shows React app                                               │
│  - Hot reload via Vite HMR (port 5173)                           │
└──────────────────────────────────────────────────────────────────┘
              ↓↑                                    ↓↑
        ┌─────────────────┐              ┌────────────────┐
        │                 │              │                │
        │   NGINX         │  requests    │  VITE DEV      │
        │  Container      │◄────────────►│  SERVER        │
        │ (port 8000)     │              │ (port 5173)    │
        │                 │              │  - HMR         │
        │                 │              │  - Hot reload  │
        └──────┬──────────┘              └────────────────┘
               │
               │ PHP requests
               ↓
        ┌─────────────────┐
        │                 │
        │  PHP-FPM        │
        │  Container      │
        │ (/app:9000)     │
        │                 │
        │  Laravel App    │
        └────────┬────────┘
                 │
                 │ Database queries
                 ↓
        ┌─────────────────────────────────────┐
        │                                     │
        │      MySQL 8.0 Container           │
        │      (db:3306)                      │
        │                                     │
        │  ┌─────────────────────────────┐   │
        │  │ Database: greatleap_central │   │
        │  │                             │   │
        │  │  ├── tenants               │   │
        │  │  ├── users (central)       │   │
        │  │  ├── domains               │   │
        │  │  └── ... other tables      │   │
        │  │                             │   │
        │  │ Tenant Databases:           │   │
        │  │  ├── tenant_<uuid-1>       │   │
        │  │  │   ├── users             │   │
        │  │  │   ├── tasks             │   │
        │  │  │   └── ...               │   │
        │  │  ├── tenant_<uuid-2>       │   │
        │  │  └── tenant_<uuid-n>       │   │
        │  └─────────────────────────────┘   │
        │                                     │
        │  User: greatleap / Pass: secret    │
        └─────────────────────────────────────┘

        ┌─────────────────────────────────────┐
        │   NODE Container (optional)         │
        │   - npm run dev                     │
        │   - Node 20                         │
        │   - Builds React components         │
        └─────────────────────────────────────┘

All containers connected via bridge network: "greatleap"
All data persisted in dbdata volume
```

---

## 2. PRODUCTION SERVER ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│               PRODUCTION SERVER (Ubuntu 24.04 LTS)               │
│                      IP: 168.144.67.229                          │
│              /var/www/new-great-leap-app (Live Code)            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  BROWSER (https://greatlap.app)                                  │
│  - Shows React app (static files from /public/build/)            │
│  - No HMR (production build)                                     │
└──────────────────────────────────────────────────────────────────┘
              ↓↑
        ┌──────────────────┐
        │                  │
        │    NGINX         │
        │ (systemd)        │
        │ Port: 80/443     │
        │                  │
        │ /etc/nginx/...   │
        │ serves from:     │
        │ /var/www/new-... │
        │ /public          │
        │                  │
        └────────┬─────────┘
                 │
                 │ PHP requests
                 ↓
        ┌───────────────────────────┐
        │                           │
        │   PHP 8.3-FPM             │
        │   (systemd service)       │
        │                           │
        │   Unix Socket:            │
        │   /var/run/php/           │
        │   php8.3-fpm.sock         │
        │                           │
        │   Processes Laravel App   │
        └────────┬──────────────────┘
                 │
                 │ Database queries
                 ↓
        ┌─────────────────────────────────────┐
        │                                     │
        │      MySQL 8.x (System)            │
        │      Port: 3306                     │
        │      Host: 127.0.0.1                │
        │                                     │
        │  ┌─────────────────────────────┐   │
        │  │ Database: greatleap_app     │   │  ⚠️ DIFFERENT NAME
        │  │ (or greatleap_central?)     │   │     FROM LOCAL!
        │  │                             │   │
        │  │  ├── tenants               │   │
        │  │  ├── users (central)       │   │
        │  │  ├── domains               │   │
        │  │  └── ... other tables      │   │
        │  │                             │   │
        │  │ Tenant Databases:           │   │
        │  │  ├── tenant_<uuid-1>       │   │
        │  │  │   ├── users             │   │
        │  │  │   ├── tasks             │   │
        │  │  │   └── ...               │   │
        │  │  ├── tenant_<uuid-2>       │   │
        │  │  └── tenant_<uuid-n>       │   │
        │  └─────────────────────────────┘   │
        │                                     │
        │  User: greatleap_user              │
        │  Pass: GreatLeap@2026              │
        │                                     │
        └─────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  GitHub Repository                            │
│  - github.com/kbabu83/GREATLEAPBOS           │
│  - Branch: main                              │
│                                               │
│  GitHub Actions (CI/CD)                      │
│  - Trigger: Push to main                     │
│  - Workflow: .github/workflows/deploy.yml    │
│  - SSH into server, git pull, deploy        │
└──────────────────────────────────────────────┘
                    ↕
            (Auto-deploy on push)
```

---

## 3. MULTI-TENANCY DATABASE STRUCTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    CENTRAL DATABASE                              │
│         (greatleap_central or greatleap_app)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   tenants   │  │    domains   │  │    users     │           │
│  ├─────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ id (UUID)   │  │ id           │  │ id           │           │
│  │ name        │  │ domain       │  │ email        │           │
│  │ email       │  │ tenant_id    │  │ password     │           │
│  │ plan        │  │              │  │ role         │           │
│  │ status      │  │              │  │ (super_admin)│           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
│  ┌───────────────────────────┐     ┌────────────────────────┐  │
│  │  subscription_plans       │     │  subscriptions         │  │
│  ├───────────────────────────┤     ├────────────────────────┤  │
│  │ id                        │     │ id                     │  │
│  │ name                      │     │ tenant_id              │  │
│  │ slug (free/starter/..)    │     │ plan_id                │  │
│  │ monthly_price             │     │ status                 │  │
│  │ annual_price              │     │ started_at             │  │
│  │ max_users                 │     │                        │  │
│  └───────────────────────────┘     └────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│             TENANT DATABASES (One per Tenant)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Database Name: tenant_<uuid>  (example: tenant_abc123def)      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐        │
│  │    users     │  │    tasks     │  │   projects     │        │
│  ├──────────────┤  ├──────────────┤  ├────────────────┤        │
│  │ id           │  │ id           │  │ id             │        │
│  │ email        │  │ title        │  │ name           │        │
│  │ password     │  │ assigned_to  │  │ description    │        │
│  │ role         │  │ status       │  │ owner_id       │        │
│  │(tenant_admin,│  │ due_date     │  │ created_by     │        │
│  │ staff)       │  │ created_by   │  │                │        │
│  │ is_active    │  │ time_logs    │  │                │        │
│  │ reporting_to │  │              │  │                │        │
│  └──────────────┘  └──────────────┘  └────────────────┘        │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │   leave_applications │  │  attendance_records  │            │
│  ├──────────────────────┤  ├──────────────────────┤            │
│  │ id                   │  │ id                   │            │
│  │ user_id              │  │ user_id              │            │
│  │ start_date           │  │ date                 │            │
│  │ end_date             │  │ check_in_time        │            │
│  │ status (pending...)  │  │ check_out_time       │            │
│  │                      │  │ status               │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                   │
│  ... and many more tenant-specific tables                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. REQUEST FLOW DIAGRAM

### Tenant Registration Flow
```
User Browser
    ↓
    │ POST /api/tenants/register
    │ {
    │   "tenant_name": "...",
    │   "admin_email": "...",
    │   "plan": "free",
    │   "number_of_users": 5
    │ }
    ↓
Nginx (Web Server)
    ↓ (routes to PHP-FPM)
    ↓
Laravel Routes/API
    ↓
TenantController::register()
    ↓
    ├─ Validate input
    ├─ Create Tenant record in CENTRAL DB
    ├─ Create Domain entry in CENTRAL DB
    ├─ Create Admin User in CENTRAL DB
    ├─ Create Subscription in CENTRAL DB
    └─ Trigger TenantCreated event
        ↓
    Listener: CreateDatabase()
        │
        ├─ Create new database: tenant_<uuid>
        └─ Trigger MigrateDatabase
            │
            └─ Run migrations in new tenant database
                │
                ├─ Create users table
                ├─ Create tasks table
                ├─ Create projects table
                └─ ... all tenant migrations
                    ↓
    Response to User
        └─ Tenant created successfully!
           Now you can log in
```

### Tenant Login & Task Creation Flow
```
User Browser
    ↓
    │ POST /api/login
    │ {
    │   "email": "john@company.com",
    │   "password": "..."
    │ }
    ↓
Laravel Auth Middleware
    ↓
    ├─ Find User in CENTRAL DB (check tenants)
    ├─ Find User in TENANT DB (check users)
    ├─ Validate credentials
    └─ Return auth token
        ↓
User now has valid token
    ↓
    │ POST /api/tenant/tasks
    │ Headers: Authorization: Bearer <token>
    │ Body: {
    │   "title": "New Task",
    │   "description": "..."
    │ }
    ↓
TenantMiddleware
    ↓
    ├─ Extract tenant_id from token/user
    ├─ Initialize tenancy context
    │   └─ Switch database connection to: tenant_<uuid>
    ├─ Verify user belongs to this tenant
    └─ Allow request
        ↓
TaskController::store()
    ↓
    ├─ Validate input
    ├─ Create Task record in TENANT DB (tenant_<uuid>)
    └─ Return created task
        ↓
Response to User
    └─ Task created successfully!
```

---

## 5. DEPLOYMENT FLOW

```
Local Development Machine
    ↓
    │ git push origin main
    ↓
GitHub Repository (main branch)
    ↓
GitHub Actions Triggered
    │
    ├─ .github/workflows/deploy.yml
    │
    └─ SSH into 168.144.67.229
        ↓
        ├─ cd /var/www/new-great-leap-app
        │
        ├─ git pull origin main
        │   └─ Latest code fetched
        │
        ├─ composer install --no-dev
        │   └─ PHP dependencies installed
        │
        ├─ php artisan migrate --force
        │   └─ Database migrations applied
        │
        ├─ php artisan config:cache
        ├─ php artisan route:cache
        └─ php artisan view:cache
            └─ Cache files built
        │
        ├─ npm install && npm run build
        │   └─ React app built and output to public/build/
        │
        ├─ sudo systemctl restart php8.3-fpm
        │   └─ PHP service restarted
        │
        └─ sudo systemctl restart nginx
            └─ Web server restarted
                ↓
        Server is now running latest code
            ↓
        Browser refreshes → New version loaded!
```

---

## 6. DATABASE NAME COMPARISON

```
LOCAL DEVELOPMENT
┌────────────────────────────┐
│  Docker MySQL Container    │
├────────────────────────────┤
│  Database: greatleap_central
│                            │
│  User: greatleap           │
│  Password: secret          │
│  Host: db (internal)       │
└────────────────────────────┘

vs

PRODUCTION SERVER
┌────────────────────────────┐
│  System MySQL              │
├────────────────────────────┤
│  Database: greatleap_app   │  ← DIFFERENT!
│           (or ?)           │     NEEDS VERIFICATION
│  User: greatleap_user      │  ← DIFFERENT
│  Password: GreatLeap@2026  │  ← DIFFERENT
│  Host: 127.0.0.1           │
└────────────────────────────┘

          ⚠️ CRITICAL MISMATCH ⚠️

This is the main configuration issue
that needs to be resolved!
```

---

## 7. COMPONENT DIAGRAM

```
                    Great Leap App Architecture

┌──────────────────────────────────────────────────────────────────┐
│                    Frontend (React)                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Components:                                              │   │
│  │  - Dashboard, Tasks, Projects, Users, Settings, etc     │   │
│  │  - Routing: React Router                                │   │
│  │  - Build: Vite (dev: HMR, prod: static)                │   │
│  │  - Styling: Tailwind CSS                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                            ↕ REST API
┌──────────────────────────────────────────────────────────────────┐
│                   Backend (Laravel)                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Controllers:                                             │   │
│  │  - TenantController (tenant CRUD)                        │   │
│  │  - UserController (user management)                      │   │
│  │  - TaskController (task management)                      │   │
│  │  - PasswordResetController (OTP reset)                   │   │
│  │  - PaymentController (Razorpay)                          │   │
│  │                                                            │   │
│  │  Models:                                                  │   │
│  │  - Tenant, User, Task, Project, Leave, etc              │   │
│  │                                                            │   │
│  │  Middleware:                                              │   │
│  │  - Auth (Sanctum token-based)                            │   │
│  │  - TenantMiddleware (multi-tenancy)                      │   │
│  │  - RoleMiddleware (role-based access)                    │   │
│  │                                                            │   │
│  │  Services:                                                │   │
│  │  - OtpService, SubscriptionService, RazorpayService    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌──────────────────────────────────────────────────────────────────┐
│                    Database (MySQL)                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Central Database:                                        │   │
│  │  - Stores: tenants, domains, central users, plans       │   │
│  │                                                            │   │
│  │  Tenant Databases (one per tenant):                      │   │
│  │  - Stores: tenant users, tasks, projects, etc           │   │
│  │  - Naming: tenant_<uuid>                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

