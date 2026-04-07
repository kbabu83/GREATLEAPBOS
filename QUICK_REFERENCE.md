# Quick Reference Card
## Great Leap App - Frontend Implementation

---

## 🚀 Start Here

```bash
cd /Users/user1/Desktop/great-leap-app01
npm install
npm run dev
```

Then visit: **http://localhost:5173/**

---

## 📍 Key URLs

| Page | URL | Auth Required | Purpose |
|------|-----|---|---------|
| Landing | `/` | No | Homepage & marketing |
| Signup | `/signup` | No | Company registration |
| Login | `/login` | No | User authentication |
| Dashboard | `/app/dashboard` | **Yes** | Main app |
| Users | `/app/users` | **Yes** | User management |
| Tasks | `/app/execution/tasks` | **Yes** | Task management |
| Company | `/app/company/*` | **Yes** | Company settings |

---

## 📁 Core Files

### Pages
```
resources/js/pages/
├── Landing.jsx           # Homepage
└── Auth/
    ├── Signup.jsx        # Company signup
    ├── Login.jsx         # User login
    └── Register.jsx      # Legacy signup
```

### Authentication
```
resources/js/
├── contexts/AuthContext.jsx
├── services/api.js
└── router.jsx
```

### Root
```
resources/js/
├── app.jsx               # Entry point
└── AppRoot.jsx           # Provider wrapper
```

---

## 🔐 Authentication

### Use useAuth() Hook
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  return (
    <div>
      {isAuthenticated && <p>Hello, {user.name}</p>}
    </div>
  );
}
```

### Access Token
```javascript
const token = localStorage.getItem('auth_token');
const user = JSON.parse(localStorage.getItem('user'));
const tenantId = localStorage.getItem('tenant_id');
```

### Make API Call
```javascript
import api from '../services/api';

const response = await api.get('/users');
// Token automatically added to header
```

---

## 🎨 Common Patterns

### Form Submission
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post('/api/endpoint', data);
    navigate('/success-page');
  } catch (err) {
    setError(err.response?.data?.message);
  }
};
```

### Protected Route
```javascript
<Route path="/app/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Icons (from @heroicons/react)
```javascript
import { CheckCircleIcon, BoltIcon, ArrowRightIcon }
  from '@heroicons/react/24/outline';

<CheckCircleIcon className="w-5 h-5 text-green-500" />
```

### Tailwind Classes
```javascript
<div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
  <h2 className="text-xl font-bold text-white mb-2">Title</h2>
  <p className="text-slate-300">Content</p>
</div>
```

---

## 🧪 Testing Commands

### Run Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Check Dependencies
```bash
npm list @heroicons/react
```

### Clear & Reinstall
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📋 Verification Checklist

- [ ] Landing page loads at `/`
- [ ] No white screen
- [ ] Icons render correctly
- [ ] Signup at `/signup` works
- [ ] Login at `/login` works
- [ ] Auto-redirect to `/app/dashboard`
- [ ] Protected routes enforce auth
- [ ] Browser console clean (F12)
- [ ] Responsive on mobile
- [ ] No API errors in Network tab

---

## 🐛 Common Issues & Fixes

### Issue: White Screen
**Fix**:
```bash
# Clear browser cache
# Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)

# Rebuild
npm run dev
```

### Issue: Icon Not Found
**Check**: Import path
```javascript
// ✅ Correct
import { CheckCircleIcon } from '@heroicons/react/24/outline';

// ❌ Wrong
import { CheckCircle } from 'lucide-react';
```

### Issue: Route Not Working
**Check**: `router.jsx` for correct path
```javascript
// ✅ Protected routes at /app
<Route path="/app" element={<ProtectedRoute>...

// ✅ Public routes at root
<Route path="/signup" element={<Signup />}
```

### Issue: API Calls Failing
**Check**:
```javascript
// 1. Backend running: php artisan serve
// 2. Token in localStorage
const token = localStorage.getItem('auth_token');

// 3. DevTools Network tab for 401/404
```

---

## 🔄 Development Workflow

1. **Make changes** to `.jsx` files
2. **Vite hot-reloads** automatically
3. **Check browser** for changes (F5 to refresh)
4. **Check console** for errors (F12)
5. **Test forms** with sample data
6. **Check Network tab** for API calls

---

## 📦 Dependencies

### Installed
```
✅ @heroicons/react v2.1.5
✅ react-router-dom v6.26.1
✅ axios v1.7.4
✅ tailwindcss v3.4.10
```

### NOT Installed
```
❌ lucide-react (use @heroicons instead)
```

---

## 🎯 File Locations

| File | Purpose |
|------|---------|
| `router.jsx` | Route definitions |
| `AuthContext.jsx` | Auth state |
| `api.js` | Axios config |
| `Landing.jsx` | Homepage |
| `Signup.jsx` | Company signup |
| `Login.jsx` | User login |
| `app.css` | Tailwind styles |

---

## 📚 Documentation

- **SIGNUP_AND_LANDING_SETUP.md** - Feature guide
- **IMPLEMENTATION_SUMMARY.md** - Architecture
- **CURRENT_STATUS.md** - Current state
- **FIXES_APPLIED_SUMMARY.md** - All fixes
- **VERIFICATION_AND_TESTING_GUIDE.md** - Testing
- **PROJECT_INVENTORY.md** - Complete inventory

---

## 🚀 Next Steps

1. ✅ All fixes applied
2. ✅ All files created
3. ✅ Dependencies installed (run `npm install`)
4. 📋 Run `npm run dev`
5. 📋 Test landing page
6. 📋 Test signup/login
7. 📋 Test protected routes

---

## 💡 Pro Tips

### Hot Reload
- Edit `.jsx` file → Browser auto-refreshes
- No need to restart `npm run dev`

### Debug API
- Open DevTools (F12)
- Go to Network tab
- Watch API calls
- Check response data

### Check Auth State
```javascript
// In browser console:
localStorage.getItem('auth_token')
JSON.parse(localStorage.getItem('user'))
```

### Responsive Testing
```javascript
// In browser DevTools:
// Cmd+Shift+M (Mac) to toggle device mode
```

---

**Happy coding!** 🚀

For detailed info, see documentation files listed above.
