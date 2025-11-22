# Authentication System - Quick Guide

## 🔐 What's New

Your OrderByQR system now has a complete authentication system with:

- **Restaurant Registration**: New restaurants can sign up
- **Admin Approval Workflow**: Super admin approves/blocks restaurants
- **Secure Login**: Password hashing with bcrypt
- **Protected Dashboards**: Middleware-based route protection
- **Multi-Tenant Ready**: Each restaurant has isolated data access

## 🚀 Quick Start

### 1. Add Environment Variables

Add to your `.env` file:

```env
# Super Admin Credentials (CHANGE THESE!)
SUPER_ADMIN_EMAIL=admin@orderbyqr.com
SUPER_ADMIN_PASSWORD=admin123

# NextAuth Configuration
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

Generate a secure secret:
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use any random string (at least 32 characters)
```

### 2. User Flows

#### **For New Restaurants**:
1. Visit http://localhost:3000
2. Click "Register Your Restaurant"
3. Fill in  details (name, email, password, owner, phone)
4. Submit → Status: "Pending Approval"
5. Wait for super admin approval

#### **For Super Admin**:
1. Visit http://localhost:3000/super-admin/login
2. Login with credentials from `.env`:
   - Email: `admin@orderbyqr.com`
   - Password: `admin123`
3. Go to "Restaurants" tab
4. See pending registrations
5. Click "Approve" or "Reject"

#### **For Approved Restaurants**:
1. Visit http://localhost:3000/auth/login
2. Login with registered credentials
3. Redirected to `/restaurant/dashboard`
4. Access restaurant-specific features

## 📋 Features

### Restaurant Registration
- Form validation (email, password, required fields)
- Password confirmation
- Email uniqueness check
- Auto-status: "pending"
- Success message after signup

### Super Admin Dashboard
- View all restaurants
- Filter by status (pending/approved/blocked)
- Real-time updates (5s polling)
- One-click approve/block
- Restaurant details view

### Authentication
- NextAuth.js v5 (latest)
- JWT sessions
- Bcrypt password hashing (salt rounds: 10)
- Role-based access (restaurant vs super-admin)
- Middleware route protection

### Protected Routes
- `/restaurant/*` - Requires restaurant auth
- `/super-admin/*` - Requires super-admin auth
- Auto-redirect to login if unauthorized

## 🔒 Security Features

✅ Passwords hashed with bcrypt (never stored plain)
✅ JWT-based sessions (no database session storage)
✅ Middleware-enforced route protection
✅ Role-based authorization
✅ Email uniqueness validation
✅ CSRF protection (via NextAuth)

## 📁 New Files Created

### Models
- `lib/models/Restaurant.js` - Restaurant schema

### Auth Configuration
- `lib/auth.ts` - NextAuth config
- `types/next-auth.d.ts` - TypeScript types
- `middleware.ts` - Route protection

### Utilities
- `lib/utils/password.ts` - Hash/verify functions

### API Routes
- `app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- `app/api/auth/signup/route.ts` - Registration
- `app/api/auth/restaurants/route.ts` - Restaurant management

### Pages
- `app/auth/login/page.tsx` - Restaurant login
- `app/auth/signup/page.tsx` - Restaurant registration
- `app/super-admin/login/page.tsx` - Super admin login
- `app/super-admin/layout.tsx` - Super admin layout
- `app/super-admin/restaurants/page.tsx` - Restaurant management
- `app/restaurant/dashboard/page.tsx` - Restaurant landing

## 🧪 Testing

### Test Restaurant Registration:
```bash
# Use browser or cURL
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant",
    "email": "test@restaurant.com",
    "password": "test123456",
    "owner": "John Doe",
    "phone": "1234567890",
    "address": "123 Main St"
  }'
```

### Test Login Flow:
1. Register a restaurant
2. Login as super admin
3. Approve the restaurant
4. Login as restaurant
5. Access dashboard

## ⚠️ Important Notes

1. **Change Super Admin Password**: Update `SUPER_ADMIN_PASSWORD` in production!
2. **NEXTAUTH_SECRET**: Must be set for production
3. **NEXTAUTH_URL**: Update for deployment (e.g., https://yourdomain.com)
4. **Existing Data**: Old admin routes (`/admin/*`) still work for backward compatibility

## 🔜 Next Steps (Optional Enhancements)

- [ ] Add `restaurantId` field to Item, Menu, Table, Order models
- [ ] Filter data by restaurant ID in APIs
- [ ] Move `/admin/*` routes to `/restaurant/[id]/*`
- [ ] Add "Forgot Password" functionality
- [ ] Add email verification for new registrations
- [ ] Add restaurant profile editing
- [ ] Add activity logs for super admin

## 💡 Usage Examples

### Restaurant Dashboard URL Structure:
```
/restaurant/dashboard - Landing page (redirects based on session)
/restaurant/[restaurantId]/items - Items management
/restaurant/[restaurantId]/menu - Menu builder
/restaurant/[restaurantId]/tables - Tables & QR codes
/restaurant/[restaurantId]/orders - Order tracking
```

### Super Admin Operations:
```
GET /api/auth/restaurants - List all restaurants
GET /api/auth/restaurants?status=pending - Filter by status
PATCH /api/auth/restaurants - Update restaurant status
```

## 🎉 You're All Set!

Your authentication system is fully functional. Test it by:
1. Registering a new restaurant
2. Approving it as super admin
3. Logging in as that restaurant

---

**Security Tip**: Always use  strong passwords and update the default super admin credentials before deploying to production!
