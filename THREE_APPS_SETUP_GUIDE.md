# 🚀 Redeem Rocket - Three Apps Setup & Build Guide

**Fixed:** April 7, 2026
**Status:** ✅ All three apps configured and working

---

## 📱 Three Applications Overview

### 1. **Customer App** (Main/Default)
- **Purpose:** Marketplace for customers to browse offers, place orders, participate in auctions
- **Port:** 5173 (default)
- **Config:** `vite.config.ts`
- **HTML Entry:** `index.html`
- **Main:** `src/main.tsx`
- **Routes:** `src/app/routes.tsx`

### 2. **Business App**
- **Purpose:** Business owner dashboard for managing products, leads, campaigns, team
- **Port:** 5174 (custom)
- **Config:** `vite.config.business.ts`
- **HTML Entry:** `business.html`
- **Main:** `src/business/main.tsx`
- **Routes:** `src/business/routes.tsx`

### 3. **Admin App**
- **Purpose:** Platform administration, moderation, analytics
- **Port:** 5175 (custom)
- **Config:** `vite.config.admin.ts`
- **HTML Entry:** `admin.html`
- **Main:** `src/admin/main.tsx`
- **Routes:** `src/admin/routes.tsx`

---

## 🔧 Fixed Issues

### Issue: CSS Import Error in Admin App
**Error:** `[plugin:vite:import-analysis] Failed to resolve import "@/index.css"`

**Root Cause:** 
- Admin app was importing `@/index.css` 
- But file exists at `src/styles/index.css`

**Solution Applied:**
✅ Changed admin app import from:
```typescript
import '@/index.css';  // ❌ Wrong
```

To:
```typescript
import '@/styles/index.css';  // ✅ Correct
```

**File Changed:** `src/admin/main.tsx`

---

## ✅ All Apps CSS Imports Verified

### Customer App
```typescript
// src/main.tsx
import "./styles/index.css";  // ✓ Relative path
```

### Business App
```typescript
// src/business/main.tsx
import '@/styles/index.css';  // ✓ Alias path
```

### Admin App
```typescript
// src/admin/main.tsx
import '@/styles/index.css';  // ✓ Alias (FIXED)
```

---

## 🚀 How to Run All Three Apps

### Development Mode

**Run all three apps simultaneously (3 terminal windows):**

```bash
# Terminal 1: Customer App (Port 5173)
npm run dev

# Terminal 2: Business App (Port 5174)
npm run dev:business

# Terminal 3: Admin App (Port 5175)
npm run dev:admin
```

**Or run them one at a time:**

```bash
# Customer App
npm run dev
# Press Ctrl+C to stop
# Then run next app

# Business App
npm run dev:business
# Press Ctrl+C to stop
# Then run next app

# Admin App
npm run dev:admin
```

### Build Mode (Production)

**Build all three apps:**

```bash
# Build Customer App (output: dist/)
npm run build

# Build Business App (output: dist-business/)
npm run build:business

# Build Admin App (output: dist-admin/)
npm run build:admin
```

---

## 🌐 Access URLs

After running dev servers:

| App | URL | Port | Purpose |
|-----|-----|------|---------|
| **Customer** | http://localhost:5173 | 5173 | Marketplace browsing, orders, auctions |
| **Business** | http://localhost:5174/business.html | 5174 | Business dashboard, lead management |
| **Admin** | http://localhost:5175/admin.html | 5175 | Platform administration |

---

## 📁 Project Structure

```
src/
├── main.tsx                          # Customer app entry
├── app/
│   ├── App.tsx
│   ├── routes.tsx                   # Customer app routes
│   └── components/                  # Shared UI components
│
├── business/
│   ├── main.tsx                     # Business app entry
│   ├── App.tsx
│   ├── routes.tsx                   # Business app routes
│   └── components/                  # Business-specific components
│
├── admin/
│   ├── main.tsx                     # Admin app entry
│   ├── App.tsx
│   ├── routes.tsx                   # Admin app routes
│   └── components/                  # Admin-specific components
│
└── styles/
    └── index.css                    # Shared styles for all three apps

index.html                           # Customer app HTML entry
business.html                        # Business app HTML entry
admin.html                           # Admin app HTML entry

vite.config.ts                       # Customer app config
vite.config.business.ts              # Business app config
vite.config.admin.ts                 # Admin app config
```

---

## ⚙️ Vite Configuration

Each app has its own Vite config with:
- ✅ Custom ports
- ✅ Unique build output directories
- ✅ Shared alias resolution (`@` → `src`)
- ✅ React and Tailwind plugins
- ✅ HTML fallback for SPA routing

---

## 🔍 Configuration Details

### Customer App (vite.config.ts)
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },            // Port
  build: { outDir: 'dist' },         // Output
  resolve: { alias: { '@': './src' } }
})
```

### Business App (vite.config.business.ts)
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss(), serveBusinessHtml()],
  server: { port: 5174 },            // Port
  build: { 
    outDir: 'dist-business',         // Output
    rollupOptions: { input: 'business.html' }
  },
  resolve: { alias: { '@': './src' } }
})
```

### Admin App (vite.config.admin.ts)
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss(), serveAdminHtml()],
  server: { port: 5175 },            // Port
  build: { 
    outDir: 'dist-admin',            // Output
    rollupOptions: { input: 'admin.html' }
  },
  resolve: { alias: { '@': './src' } }
})
```

---

## 🧪 Testing All Three Apps

### Quick Verification Checklist

**Customer App**
- [ ] Can load http://localhost:5173
- [ ] Can view offers/products
- [ ] Can place orders
- [ ] Navigation works

**Business App**
- [ ] Can load http://localhost:5174/business.html
- [ ] Dashboard displays
- [ ] Can manage leads
- [ ] Team page works
- [ ] Can create campaigns

**Admin App**
- [ ] Can load http://localhost:5175/admin.html
- [ ] Admin dashboard displays
- [ ] Can view users
- [ ] Analytics work

---

## 🐛 Common Issues & Solutions

### Issue: Port Already in Use
```bash
# Kill process on port
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config
server: { port: 5173 }  → server: { port: 3000 }
```

### Issue: Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: CSS Not Loading
```bash
# Make sure imports are correct:
# Customer:  import "./styles/index.css";
# Business:  import '@/styles/index.css';
# Admin:     import '@/styles/index.css';
```

### Issue: Routes Not Working
- Check that router is exported correctly
- Verify basename matches HTML route prefix
- Clear browser cache and reload

---

## 📦 Build Outputs

After running `npm run build:*`, you get:

```
dist/                       # Customer app build
├── index.html
├── assets/
└── (bundled JS/CSS)

dist-business/              # Business app build
├── business.html
├── assets/
└── (bundled JS/CSS)

dist-admin/                 # Admin app build
├── admin.html
├── assets/
└── (bundled JS/CSS)
```

---

## 🚀 Deployment

### Deploy to Vercel

Each app can be deployed separately:

**Option 1: Deploy Each App as Separate Project**
```bash
# Create 3 Vercel projects (one for each app)
vercel create --name=redeem-rocket-customer
vercel create --name=redeem-rocket-business
vercel create --name=redeem-rocket-admin

# Set build command for each:
# Customer: npm run build
# Business: npm run build:business
# Admin:    npm run build:admin

# Set output directory:
# Customer: dist
# Business: dist-business
# Admin:    dist-admin
```

**Option 2: Deploy All to Single Vercel Project (Monorepo)**
```json
{
  "buildCommand": "npm run build && npm run build:business && npm run build:admin",
  "outputDirectory": "dist"
}
```

---

## ✨ Success Indicators

✅ All three vite configs exist and are correct
✅ All CSS imports resolved correctly
✅ All routes configured properly
✅ All HTML entry points present
✅ Build scripts available in package.json
✅ No import resolution errors

---

**Last Updated:** April 7, 2026
**Status:** ✅ All three apps configured and ready

