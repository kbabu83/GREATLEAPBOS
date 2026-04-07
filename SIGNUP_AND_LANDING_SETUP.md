# Signup, Login & Landing Page Setup

Complete guide to the new company signup flow, authentication system, and landing page.

---

## 📋 Overview

### What's New

1. **Modern Landing Page** - High-converting one-page website
2. **Company Signup Flow** - Create company + admin user in 3 steps
3. **Enhanced Login** - Email/password authentication
4. **Auto-Login** - Automatic authentication token on signup

---

## 🏠 Landing Page

### Location
`resources/js/pages/Landing.jsx`

### Features

- **Hero Section**: Headline "Run Your Business Roles. Not Just Tasks."
- **Problem Section**: Identifies key business pain points
- **Solution Section**: Role-based execution explained
- **Features Section**: 6 key features highlighted
- **How It Works**: 4-step process visualization
- **Benefits Section**: Real results and testimonials
- **CTA Section**: Multiple conversion opportunities

### Design
- Dark theme with blue/cyan gradient accents
- Modern SaaS aesthetic
- Fully responsive
- Smooth scroll animations
- Fixed navigation bar with CTAs

### Navigation Links
- `/` - Landing page (auto-shows on first visit)
- `/signup` - Create company button
- `/login` - Existing users login

---

## 📝 Company Signup Flow

### Location
`resources/js/pages/Auth/Signup.jsx`

### Backend Endpoint
```
POST /api/tenants/register
```

### Flow Overview

**Step 1: Company Details**
- Company name
- Company email
- Subdomain (with availability check)

**Step 2: Admin User**
- Full name
- Email address
- Password (8+ characters)
- Confirm password

**Step 3: Plan Selection**
- Free ($0)
- Starter ($99/mo)
- Professional ($299/mo)

**Step 4: Confirmation**
- Shows success message
- Auto-redirects to dashboard
- User is automatically logged in

### Validation
```
Company Name: Required
Company Email: Required, valid email format
Subdomain: Required, alphanumeric + hyphens, must be available
Admin Name: Required
Admin Email: Required, valid format, unique
Password: Min 8 characters
Password Confirmation: Must match
Plan: Must be selected
```

### Response (Success)
```json
{
  "message": "Company registered successfully.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@company.com",
    "role": "tenant_admin",
    "tenant_id": "acme-corp",
    "tenant_name": "Acme Corp"
  },
  "token": "auth-token-string",
  "tenant_id": "acme-corp",
  "subdomain": "acme-corp",
  "domain": "http://acme-corp.greatlap.local"
}
```

### What Happens On Signup

1. **Backend**:
   - Creates Tenant (company)
   - Creates Domain (subdomain mapping)
   - Initializes tenant database
   - Creates first user (admin)
   - Assigns `tenant_admin` role
   - Generates auth token

2. **Frontend**:
   - Stores token in `localStorage`
   - Stores user data
   - Stores tenant_id
   - Auto-redirects to `/app/dashboard`
   - User is logged in immediately

---

## 🔐 Login System

### Location
`resources/js/pages/Auth/Login.jsx`

### Endpoint
```
POST /api/auth/login
```

### Form Fields
- Email address
- Password
- "Remember me" checkbox (optional)
- "Forgot password?" link

### Flow
1. User enters credentials
2. POST request to `/api/auth/login`
3. Receives auth token and user data
4. Stores in localStorage
5. Redirects to `/app/dashboard`

### Error Handling
- "Invalid email or password" for auth failures
- Custom error messages for validation issues
- Errors displayed in alert box

### Demo Credentials
```
Email: demo@company.com
Password: password123
```

---

## 🔑 Authentication System

### Token Management

**On Signup/Login**:
```javascript
localStorage.setItem('auth_token', response.data.token);
localStorage.setItem('user', JSON.stringify(response.data.user));
localStorage.setItem('tenant_id', response.data.tenant_id);
```

**For API Requests**:
```javascript
// Automatically added to all axios requests
headers: {
  'Authorization': `Bearer ${token}`
}
```

### User Object
```javascript
{
  id: "uuid",
  name: "John Doe",
  email: "john@company.com",
  role: "tenant_admin",
  tenant_id: "acme-corp",
  tenant_name: "Acme Corp",
  avatar: "url",
  is_active: true,
  created_at: "iso-timestamp"
}
```

---

## 🛣️ Routing Structure

### Public Routes
```
/                  - Landing page
/login             - Login form
/signup            - Company signup
/register          - Alternative signup (legacy)
/forgot-password   - Password reset
```

### Protected Routes
```
/app/dashboard         - Main dashboard
/app/users            - User management
/app/execution/tasks  - Task management
/app/execution/roles  - Role management
... (all other app routes)
```

### Route Guards

**PublicRoute** Component:
- Shows page only if user is NOT logged in
- Redirects authenticated users to `/app/dashboard`

**ProtectedRoute** Component:
- Shows page only if user IS logged in
- Checks role-based access
- Redirects unauthorized users to `/app/dashboard`

---

## 🎨 Design System

### Colors
- **Primary**: Blue (`#3b82f6`)
- **Secondary**: Cyan (`#06b6d4`)
- **Background**: Slate 950 (`#030712`)
- **Surface**: Slate 900 (`#0f172a`)
- **Border**: Slate 800 (`#1e293b`)

### Typography
- **Headline**: Bold, 3-5xl
- **Subheading**: Medium, 1.5-2xl
- **Body**: Regular, base-lg
- **Caption**: Small (12px)

### Components

**Buttons**:
- Primary: Blue gradient with hover effect
- Secondary: Border-only with hover background
- Loading: Shows spinner during submission

**Inputs**:
- Rounded corners (lg)
- Slate 800 background
- Blue border on focus
- Full width in forms

**Cards**:
- Slate 900 background with slate 800 border
- Rounded-xl corners
- Hover effects on interactive cards

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- PHP 8.1+
- MySQL 8+
- Laravel 10+

### Setup Steps

1. **Backend Routes**
   - Already configured in `routes/api.php`
   - Endpoints ready for signup/login

2. **Frontend Components**
   - Landing page: `resources/js/pages/Landing.jsx`
   - Signup: `resources/js/pages/Auth/Signup.jsx`
   - Login: `resources/js/pages/Auth/Login.jsx`

3. **Routing**
   - Updated `resources/js/router.jsx`
   - All routes connected

4. **Start Development Server**
   ```bash
   npm run dev
   # OR
   npm run dev -- --host
   ```

5. **Visit Landing Page**
   - Open: `http://localhost:5173/`
   - Click "Get Started" to begin signup

---

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Optimizations
- Hamburger menu on navigation (if needed)
- Touch-friendly buttons (min 48px)
- Stacked layout for forms
- Full-width inputs and buttons

---

## ✨ Key Features

### Landing Page
- ✅ Gradient animations
- ✅ Smooth scroll between sections
- ✅ Responsive grid layouts
- ✅ Call-to-action buttons
- ✅ Feature showcases
- ✅ Testimonials section
- ✅ Fast load times

### Signup Form
- ✅ Multi-step wizard interface
- ✅ Progress indicator
- ✅ Real-time validation
- ✅ Subdomain availability check
- ✅ Password strength requirement
- ✅ Error messaging
- ✅ Auto-login on success

### Login Form
- ✅ Email/password authentication
- ✅ Remember me checkbox
- ✅ Forgot password link
- ✅ Error display
- ✅ Demo credentials shown
- ✅ Link to signup

---

## 🔍 Testing

### Test Signup Flow
1. Go to `http://localhost:5173/`
2. Click "Get Started"
3. Fill company details
4. Check subdomain availability
5. Fill admin details
6. Select plan
7. Confirm creation
8. Should auto-redirect to dashboard

### Test Login
1. Go to `/login`
2. Use demo credentials:
   - Email: `demo@company.com`
   - Password: `password123`
3. Should redirect to dashboard
4. User data shown in header

### Test Landing Page
1. Open `http://localhost:5173/`
2. Scroll through sections
3. Test CTAs:
   - "Get Started" → `/signup`
   - "Login" → `/login`
4. Check responsive design on mobile

---

## 🐛 Troubleshooting

### Signup Fails
- **Check**: API endpoint is `/api/tenants/register` (public route)
- **Check**: Email is unique
- **Check**: Subdomain is valid format (alphanumeric + hyphens)
- **Check**: Password is min 8 characters
- **Check**: Password confirmation matches

### Login Fails
- **Check**: Email exists in database
- **Check**: Password is correct
- **Check**: User account is active (`is_active = true`)
- **Check**: Tenant status is `active`

### Landing Page Not Showing
- **Check**: Route `/` is configured
- **Check**: Landing.jsx is imported in router
- **Check**: Component is not wrapped in ProtectedRoute

### Styles Not Applied
- **Check**: Tailwind CSS is compiled
- **Check**: Build process is running (`npm run dev`)
- **Check**: CSS classes are spelled correctly

---

## 📊 Analytics Points

Track these for conversion optimization:
- Landing page views
- CTA click-through rates
- Signup step completion rates
- Form abandonment rates
- Login success rates
- Feature page views
- Time spent on landing page

---

## 🔒 Security Notes

### Passwords
- Minimum 8 characters
- Hashed using Laravel's `Hash::make()`
- Never stored in plaintext
- Sent over HTTPS only

### Tokens
- Stored in browser localStorage
- Included in `Authorization: Bearer` header
- Generated per-user per-login
- Can be revoked

### CSRF Protection
- Laravel provides CSRF middleware
- Apply to POST/PUT/DELETE routes
- Tokens rotated per request (if configured)

### Multi-Tenancy
- Each company gets isolated database
- Users can only access their tenant
- Tenant context set on login
- Row-level security enforced

---

## 📚 Additional Resources

- **Payment Setup**: See `PAYMENT_AND_EMAIL_SETUP.md`
- **API Documentation**: See routes in `routes/api.php`
- **Database Schema**: See migrations in `database/migrations/`
- **Frontend Guide**: See component comments

---

## 🎯 Next Steps

1. **Customize Landing Page**
   - Update company name/logo
   - Adjust colors to brand
   - Add custom features
   - Change testimonials

2. **Configure Email**
   - Set up AWS SES or SMTP
   - Add welcome email template
   - Personalize messages

3. **Add Analytics**
   - Integrate GA4 or Mixpanel
   - Track conversion funnel
   - Monitor signup drop-off

4. **Set Up Domain**
   - Get custom domain
   - SSL certificate
   - Update `CENTRAL_DOMAIN` in .env

---

**Version**: 1.0.0
**Status**: Production Ready ✅
