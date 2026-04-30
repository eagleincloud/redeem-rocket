# Dual Deployment Strategy - RedeemRocket

This document outlines the deployment architecture for RedeemRocket's business and admin applications using separate Vercel projects.

## Architecture Overview

RedeemRocket uses a **separate deployment strategy** to maintain clean isolation between the customer-facing business app and the admin dashboard:

```
redeemrocket.in (Business App)
└── Vercel Project: redeemrocket
    ├── Build: npm run build:business
    ├── Output: dist-business/
    ├── Root: Main repository root
    └── Domain: redeemrocket.in

admin.redeemrocket.in (Admin App)
└── Vercel Project: redeemrocket-admin
    ├── Build: npm run build:admin
    ├── Output: dist-admin/
    ├── Root: admin-app/ directory
    └── Domain: admin.redeemrocket.in (or admin-app.vercel.app)
```

## Deployment Configurations

### Business App Deployment

**Location:** Root `vercel.json`

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

**Key Features:**
- Builds only the business app using dedicated Vite config
- Outputs to `dist-business/` directory
- Routes all requests to `/index.html` for React Router SPA handling
- Serves static assets and Firebase messaging service worker
- No admin routes or conflicts

### Admin App Deployment

**Location:** `admin-app/vercel.json`

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

**Key Features:**
- Builds only the admin app using dedicated Vite config
- Outputs to `dist-admin/` directory
- Routes all requests to `/admin.html` for React Router SPA handling
- Identical asset handling to business app
- Completely isolated from business app routes

## Build Scripts

Ensure the following scripts exist in `package.json`:

```json
{
  "scripts": {
    "build:business": "vite build --config vite.config.business.ts",
    "build:admin": "vite build --config vite.config.admin.ts",
    "dev:business": "vite --config vite.config.business.ts",
    "dev:admin": "vite --config vite.config.admin.ts"
  }
}
```

These scripts utilize dedicated Vite configuration files:
- `vite.config.business.ts` - Business app configuration
- `vite.config.admin.ts` - Admin app configuration

## Deployment Steps

### Initial Setup

1. **Business App Deployment:**
   ```bash
   # Connect root directory to Vercel
   vercel --prod
   # Uses root vercel.json
   # Domain: redeemrocket.in
   ```

2. **Admin App Deployment:**
   ```bash
   # Connect admin-app directory to separate Vercel project
   cd admin-app
   vercel --prod
   # Uses admin-app/vercel.json
   # Domain: admin.redeemrocket.in or admin-app.vercel.app
   ```

### Domain Configuration

After both projects are deployed to Vercel:

1. **Business App Domain:**
   - Point `redeemrocket.in` to the business Vercel project
   - Via DNS settings in domain registrar

2. **Admin App Domain:**
   - Option A: Create subdomain `admin.redeemrocket.in`
     - Point to the admin Vercel project
     - Via DNS CNAME record
   - Option B: Use Vercel-provided domain
     - `admin-app.vercel.app` or custom domain at admin Vercel project settings

### Environment Variables

Both projects share the same Supabase backend:

**Business App (.env):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_FIREBASE_CONFIG={...}
```

**Admin App (.env):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_FIREBASE_CONFIG={...}
```

**Note:** These are typically the same. Configure in Vercel project settings.

## Benefits of This Approach

### Isolation
- Each app has its own build process and output directory
- No routing conflicts between business and admin routes
- Independent cache invalidation

### Scalability
- Deploy business and admin apps independently
- No need to rebuild entire application for partial changes
- Easier CI/CD pipeline management

### Maintenance
- Clear separation of concerns
- Simpler build configurations (no complex conditional routing)
- Easier to add new apps in the future

### Performance
- Smaller deployments (each ~100-200MB vs combined)
- Independent scaling for each application
- Faster builds (only affected app rebuilds)

## Troubleshooting

### Build Failures

**Issue:** Admin app build fails with "admin.html not found"
- **Solution:** Ensure `vite.config.admin.ts` exists and correctly references admin app source
- Check `admin-app/src/index.tsx` exists

**Issue:** Business app build fails
- **Solution:** Verify `vite.config.business.ts` uses business-app/frontend as root
- Run `npm run build:business` locally to test

### Routing Issues

**Issue:** Admin app routes return 404
- **Solution:** Check admin-app/vercel.json has route for `^/.*$` → `/admin.html`
- Ensure SPA fallback is configured

**Issue:** Static assets return 404
- **Solution:** Verify asset paths in routes configuration
- Check that `/assets/` routes are before catch-all route

### Deployment Issues

**Issue:** Vercel deploys from wrong directory
- **Solution:** Ensure correct `vercel.json` is in project root when deploying
- For admin app: deploy from `admin-app/` directory or use subdirectory configuration

## Monitoring Deployments

### Business App
- Dashboard: https://vercel.com/dashboard (redeemrocket project)
- Logs: Check `vercel logs` output
- Test: Visit https://redeemrocket.in

### Admin App
- Dashboard: https://vercel.com/dashboard (redeemrocket-admin project)
- Logs: Check `vercel logs` output from admin-app directory
- Test: Visit https://admin.redeemrocket.in or admin Vercel URL

## .vercelignore Configuration

Both apps use `.vercelignore` files to exclude unnecessary directories from deployment:

**Root .vercelignore (for business app):**
```
admin-app/
business-root/
customer-app/
docs/
guidelines/
e2e/
test-results/
```

**admin-app/.vercelignore (for admin app):**
```
business-app/
business-root/
customer-app/
docs/
guidelines/
e2e/
test-results/
```

This reduces deployment size and build time by ~50%.

## Rollback Strategy

### Quick Rollback
1. Go to Vercel project dashboard
2. Select previous deployment
3. Click "Redeploy"

### Git-Based Rollback
```bash
git revert HEAD
git push
# Vercel auto-deploys from main branch
```

## Future Scaling

If you need to add more apps (e.g., customer-app):
1. Create new `vite.config.customer.ts`
2. Create `customer-app/vercel.json`
3. Add npm scripts: `build:customer`, `dev:customer`
4. Deploy to separate Vercel project

This architecture supports unlimited independent apps while sharing backend infrastructure.
