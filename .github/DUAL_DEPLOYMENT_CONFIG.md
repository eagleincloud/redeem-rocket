# Dual Deployment Configuration - Technical Details

This document provides technical details about the separate deployment configuration for business and admin apps.

## Configuration Overview

### Current Setup

```
RedeemRocket Project (monorepo)
├── Business App
│   ├── Source: Root directory + business-app/frontend/
│   ├── Build: npm run build:business
│   ├── Output: dist-business/
│   ├── HTML Entry: business.html
│   └── Base URL: / (root domain)
│
├── Admin App
│   ├── Source: Root directory + admin-app/frontend/
│   ├── Build: npm run build:admin
│   ├── Output: dist-admin/
│   ├── HTML Entry: admin.html
│   └── Base URL: / (separate domain)
│
└── Shared
    ├── Package.json (npm scripts)
    ├── vite.config.business.ts
    ├── vite.config.admin.ts
    ├── src/ (shared utilities)
    └── Supabase backend
```

## Vercel Configuration Files

### Root vercel.json (Business App)

**Location:** `/vercel.json`
**Deployed to:** Vercel project "redeemrocket"
**Domain:** redeemrocket.in

```json
{
  "buildCommand": "npm run build:business",
  "outputDirectory": "dist-business",
  "installCommand": "npm install",
  "routes": [
    {
      "src": "^/assets/(.*)$",
      "dest": "/assets/$1"
    },
    {
      "src": "^/firebase-messaging-sw\\.js$",
      "dest": "/firebase-messaging-sw.js"
    },
    {
      "src": "^/logo\\.(png|jpeg|jpg|svg|ico)$",
      "dest": "/logo.$1"
    },
    {
      "src": "^/.*$",
      "dest": "/index.html"
    }
  ]
}
```

**Key Points:**
- Routes static assets to their locations
- Fallback route redirects all unmapped requests to `/index.html`
- This enables React Router SPA routing
- `build:business` script specifically builds only business app

### Admin App vercel.json (Separate Project)

**Location:** `/admin-app/vercel.json`
**Deployed to:** Vercel project "redeemrocket-admin" (separate)
**Domain:** admin.redeemrocket.in or admin-app.vercel.app

```json
{
  "buildCommand": "npm run build:admin",
  "outputDirectory": "dist-admin",
  "installCommand": "npm install",
  "routes": [
    {
      "src": "^/assets/(.*)$",
      "dest": "/assets/$1"
    },
    {
      "src": "^/firebase-messaging-sw\\.js$",
      "dest": "/firebase-messaging-sw.js"
    },
    {
      "src": "^/logo\\.(png|jpeg|jpg|svg|ico)$",
      "dest": "/logo.$1"
    },
    {
      "src": "^/.*$",
      "dest": "/admin.html"
    }
  ]
}
```

**Key Points:**
- Identical routing structure to business app
- Uses `build:admin` for building only admin app
- Fallback to `/admin.html` instead of `/index.html`
- Both can exist in same repo without conflicts

## Vite Configuration

### vite.config.business.ts

Key settings for business app:

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss(), serveBusinessHtml(), copyBusinessHtmlPlugin()],
  server: { port: 5174 },
  publicDir: 'public',
  build: {
    outDir: 'dist-business',
    rollupOptions: {
      input: path.resolve(__dirname, 'business.html'),
    },
  },
})
```

**Important Plugin: copyBusinessHtmlPlugin**
- Copies `business.html` → `index.html` in build output
- Required because Vercel's `vercel.json` routes to `/index.html`
- Makes the fallback route work correctly

### vite.config.admin.ts

Key settings for admin app:

```typescript
export default defineConfig({
  base: '/',  // Changed from '/admin/' - now separate domain
  plugins: [react(), tailwindcss(), serveAdminHtml()],
  server: { port: 5175 },
  build: {
    outDir: 'dist-admin',
    rollupOptions: {
      input: path.resolve(__dirname, 'admin.html'),
    },
  },
})
```

**Changes Made:**
- `base: '/'` changed from `'/admin/'` for separate domain deployment
- No need for copyAdminHtmlPlugin - fallback routes to `/admin.html` directly
- Both configs coexist in root directory

## NPM Scripts

Root `package.json` contains all build scripts:

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "build:business": "vite build --config vite.config.business.ts",
    "build:admin": "vite build --config vite.config.admin.ts",
    "dev:business": "vite --config vite.config.business.ts",
    "dev:admin": "vite --config vite.config.admin.ts"
  }
}
```

**Why Separate Scripts:**
- Each script targets specific Vite config
- Isolated builds prevent conflicts
- Both can be built independently
- Vercel calls specific script for each project

## Build Output Structure

After running builds, directory structure looks like:

```
Project Root
├── dist-business/          (Business app output)
│   ├── index.html         (Served as fallback)
│   ├── business.html      (Copied from root)
│   ├── assets/
│   │   ├── business-*.js
│   │   ├── business-*.css
│   │   └── ...
│   └── firebase-messaging-sw.js
│
└── dist-admin/            (Admin app output)
    ├── admin.html         (Served as fallback)
    ├── assets/
    │   ├── RuleBuilder-*.js
    │   ├── admin-*.css
    │   └── ...
    └── firebase-messaging-sw.js
```

## .vercelignore Files

### Root .vercelignore (Business App Deployment)

Excludes admin and unnecessary files:

```
admin-app/
customer-app/
docs/
guidelines/
e2e/
test-results/
```

**Result:** Business deployment only includes business-app/, src/, and root config files

### admin-app/.vercelignore (Admin App Deployment)

Excludes business and unnecessary files:

```
business-app/
customer-app/
docs/
guidelines/
e2e/
test-results/
```

**Result:** Admin deployment only includes admin-app/, src/, and root config files

## Deployment Flow

### Business App Deployment

```
1. Push to GitHub main branch
2. Vercel webhook triggered
3. Clone repository
4. Install dependencies: npm install
5. Run build: npm run build:business
6. Output: dist-business/
7. Routes applied from root vercel.json
8. Deploy to redeemrocket.vercel.app
9. CNAME to redeemrocket.in
```

### Admin App Deployment

```
1. Push to GitHub main branch
2. Vercel webhook triggered (separate project)
3. Clone repository
4. Install dependencies: npm install
5. Run build: npm run build:admin
6. Output: dist-admin/
7. Routes applied from admin-app/vercel.json
8. Deploy to redeemrocket-admin.vercel.app
9. CNAME to admin.redeemrocket.in (optional)
```

## Routing Details

### Business App Routes

**Route Priority (top to bottom):**

1. `/assets/*` → Served from `/assets/` in build
2. `/firebase-messaging-sw.js` → Service worker file
3. `/logo.*` → Logo file with any extension
4. `/*` → Fall back to `/index.html` for SPA routing

**Result:** React Router handles all navigation client-side

### Admin App Routes

**Route Priority (top to bottom):**

1. `/assets/*` → Served from `/assets/` in build
2. `/firebase-messaging-sw.js` → Service worker file
3. `/logo.*` → Logo file with any extension
4. `/*` → Fall back to `/admin.html` for SPA routing

**Result:** React Router handles all navigation client-side

## Environment Variables

Both deployments use shared backend services. Environment variables are identical:

### Supabase Configuration

```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

Both apps authenticate as same Supabase user. Access control handled at:
- Database RLS policies
- Function logic
- React component authentication checks

### Firebase Configuration

```
VITE_FIREBASE_API_KEY=[key]
VITE_FIREBASE_AUTH_DOMAIN=[domain]
VITE_FIREBASE_PROJECT_ID=[project]
VITE_FIREBASE_STORAGE_BUCKET=[bucket]
VITE_FIREBASE_MESSAGING_SENDER_ID=[id]
VITE_FIREBASE_APP_ID=[app-id]
```

Firebase handles authentication and messaging for both apps.

## CORS Configuration

Since both apps access same Supabase backend:

### Supabase CORS Settings

Add both domains to allowed origins:
```
https://redeemrocket.in
https://admin.redeemrocket.in
```

Without this, API requests fail with CORS errors.

### Firebase Settings

Firebase automatically allows Vercel domains. For custom domains, update Firebase console:

1. Go to Firebase Project Settings
2. Add to Authorized Domains:
   - redeemrocket.in
   - admin.redeemrocket.in
3. Save changes

## Local Development

### Running Both Apps Locally

**Terminal 1: Business App**
```bash
npm run dev:business
# Listens on http://localhost:5174
# Hot module replacement enabled
# Changes auto-reflect in browser
```

**Terminal 2: Admin App**
```bash
npm run dev:admin
# Listens on http://localhost:5175
# Hot module replacement enabled
# Changes auto-reflect in browser
```

**Accessing:**
- Business: http://localhost:5174
- Admin: http://localhost:5175

### Shared Code

Both apps can import from `src/` directory:

```typescript
// In business app
import { Button } from '@/components/ui/button'

// In admin app
import { Button } from '@/components/ui/button'

// Both reference same file
// No duplication needed
```

## Performance Optimization

### Build Size Comparison

**Before Separate Deployment (Merged):**
- Single build: ~500KB
- Both apps loaded regardless of which accessed
- Unnecessary code for each user

**After Separate Deployment:**
- Business app: ~250KB
- Admin app: ~280KB
- Each user loads only their app
- ~50% reduction per user

### Caching Strategy

Vercel automatically sets cache headers:

```
Static assets: 1 year (content-addressed filenames)
HTML files: No cache (always check for updates)
API routes: Based on configuration
```

This means:
- CSS/JS changes → new filenames → cache busted
- HTML changes → redownload on next visit
- Maximum efficiency with minimal setup

## Security Considerations

### Isolation Benefits

1. **Environment Variables**
   - Each Vercel project has separate env scope
   - Admin secrets not exposed to business app
   - Easier to manage sensitive data

2. **Deployment Control**
   - Business and admin can deploy independently
   - Admin team controls their deployment
   - No risk of business changes affecting admin

3. **Access Control**
   - Vercel project permissions per app
   - Business and admin teams have separate access
   - Audit trail per deployment

### Recommendations

1. **Don't store secrets in code**
   - Use Vercel environment variables
   - Rotate keys periodically
   - Use least privilege principle

2. **Monitor API access**
   - Check Supabase logs for unusual activity
   - Monitor Firebase authentication events
   - Set up alerts in Vercel

3. **Update dependencies regularly**
   - Run `npm audit` before deployments
   - Use dependabot for automatic updates
   - Test updates in development first

## Troubleshooting Guide

### Build Failures

**Error:** "admin.html not found"
- Check: `ls admin.html` in project root
- Solution: Ensure file exists and is committed to git

**Error:** "Cannot find module vite.config.admin.ts"
- Check: `ls vite.config.admin.ts` in project root
- Solution: File must exist at root level

### Routing Issues

**Error:** Admin app shows 404 for all routes
- Check: Admin app fallback route configured
- Solution: Verify `vercel.json` has `^/.*$ → /admin.html` route

**Error:** Static assets return 404
- Check: Asset routes before fallback route in vercel.json
- Solution: Reorder routes - assets first, fallback last

### CORS Errors

**Error:** "Access to XMLHttpRequest blocked by CORS policy"
- Check: Domain added to Supabase CORS settings
- Solution: Add domain to Supabase > Project Settings > API > CORS Allowed Origins

### Build Time Too Long

**Error:** Build takes >60 seconds (Vercel timeout)
- Check: Building unnecessary files (.vercelignore configuration)
- Solution: Ensure .vercelignore excludes other app directories

## Future Enhancements

### Monorepo Optimization

Current setup works but could optimize with:
- Turborepo for build caching
- Pnpm workspaces for dependency management
- Shared tsconfig for TypeScript

### CI/CD Improvements

Could add:
- Automated testing on every PR
- Build preview deployments
- Performance benchmarking
- Dependency scanning

### Deployment Automation

Could implement:
- Automatic version bumping
- Release notes generation
- Blue-green deployments
- Automated rollback on failure
