# Separate Deployment Quick Reference

## Configuration Summary

### Business App (Root Project)
- **Build Command:** `npm run build:business`
- **Output Directory:** `dist-business/`
- **Vercel Config:** `/vercel.json`
- **Vite Config:** `vite.config.business.ts`
- **HTML Entry:** `business.html` → copies to `index.html`
- **Domain:** redeemrocket.in
- **Fallback Route:** `/index.html`

### Admin App (Separate Project)
- **Build Command:** `npm run build:admin`
- **Output Directory:** `dist-admin/`
- **Vercel Config:** `admin-app/vercel.json`
- **Vite Config:** `vite.config.admin.ts`
- **HTML Entry:** `admin.html`
- **Domain:** admin.redeemrocket.in (or admin-app.vercel.app)
- **Fallback Route:** `/admin.html`

## Files Changed

### Vercel Configuration
```
✓ /vercel.json                        (Updated for business-only)
✓ /admin-app/vercel.json             (Created)
✓ /admin-app/.vercelignore           (Created)
✓ /business-app/frontend/.vercelignore (Created)
```

### Vite Configuration
```
✓ /vite.config.admin.ts              (Updated - base: '/')
✓ /vite.config.business.ts           (Unchanged)
```

### Documentation
```
✓ /.github/DEPLOYMENT.md             (Created)
✓ /.github/DUAL_DEPLOYMENT_CONFIG.md (Created)
✓ /ADMIN_DEPLOYMENT_SETUP.md         (Created)
```

## Git Commits

### Commit 1: Configuration
```
29e560b Configure admin app for separate Vercel deployment
- Creates admin-app/vercel.json
- Updates root vercel.json
- Removes /admin/ base from vite config
- Adds .vercelignore files
```

### Commit 2: Documentation
```
ec92e5a Add comprehensive documentation for dual deployment strategy
- Deployment architecture overview
- Technical configuration details
- Step-by-step setup guide
```

## Deployment Steps

### Step 1: Deploy Business App (Root Project)
Already configured - no changes needed for current Vercel project.

```bash
# Verify build works locally
npm run build:business

# Vercel auto-deploys when:
git push origin main
# Uses: /vercel.json
# Builds: npm run build:business
# Output: dist-business/
# URL: redeemrocket.in
```

### Step 2: Create New Vercel Project for Admin

#### Option A: CLI
```bash
cd admin-app
vercel --prod
# When prompted:
# - Project name: redeemrocket-admin
# - Framework: Vite
# - Root directory: ./
```

#### Option B: Dashboard
1. https://vercel.com/dashboard
2. "Add New..." → "Project"
3. Select repository
4. Configure:
   - Name: redeemrocket-admin
   - Root Directory: ./admin-app
   - Build Command: npm run build:admin
   - Output Directory: dist-admin
5. "Deploy"

### Step 3: Configure Environment Variables

In admin Vercel project settings:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_FIREBASE_CONFIG=...
```

Same values as business project.

### Step 4: Configure Custom Domain (Optional)

Add DNS record for `admin.redeemrocket.in` pointing to admin Vercel project.

## Local Development

### Build Both Apps
```bash
npm run build:business    # → dist-business/
npm run build:admin       # → dist-admin/
```

### Dev Mode - App 1
```bash
npm run dev:business
# http://localhost:5174
```

### Dev Mode - App 2
```bash
npm run dev:admin
# http://localhost:5175
```

## Key Changes From Previous Setup

### Before (Merged Deployment)
- Both apps in one Vercel project
- Complex routing to distinguish /admin/ from business routes
- Single `vercel.json` with conditional logic
- Shared build output directory

### After (Separate Deployments)
- Business in root Vercel project
- Admin in separate Vercel project
- Simple routing for each
- Independent `vercel.json` files
- Separate output directories
- No conflicts or complexity

## Important Notes

### Base URL Change
- Admin app: `/admin/` → `/` (since it's now on separate domain)
- This change is in `vite.config.admin.ts`
- Enables correct asset loading on separate domain

### SPA Routing
Both apps use React Router with fallback routes:
- Business: `/index.html`
- Admin: `/admin.html`

This allows client-side navigation without server rewrites.

### Shared Backend
Both apps use same:
- Supabase database
- Firebase authentication
- Storage infrastructure

No database changes needed.

### .vercelignore Purpose
Reduces deployment size by ~50%:
- Business deployment excludes `admin-app/`
- Admin deployment excludes `business-app/`
- Both exclude unnecessary directories

## Verification Checklist

After deployment:

- [ ] Business app loads at redeemrocket.in
- [ ] Admin app loads at admin.redeemrocket.in
- [ ] Both apps use same Supabase backend
- [ ] User authentication works in both
- [ ] Static assets load correctly
- [ ] Firebase messaging works
- [ ] No 404 errors on page refresh
- [ ] No CORS errors in console

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Build fails | Check `npm run build:admin` locally |
| 404 on routes | Verify fallback route in vercel.json |
| CORS errors | Add domain to Supabase CORS settings |
| Assets missing | Check .vercelignore configuration |
| Wrong env vars | Verify Vercel project settings |

## Documentation Links

For more details, see:

1. **[.github/DEPLOYMENT.md](.github/DEPLOYMENT.md)**
   - Architecture overview
   - Benefits and considerations
   - Monitoring strategy

2. **[.github/DUAL_DEPLOYMENT_CONFIG.md](.github/DUAL_DEPLOYMENT_CONFIG.md)**
   - Technical configuration details
   - File structure and routing
   - Environment setup

3. **[ADMIN_DEPLOYMENT_SETUP.md](ADMIN_DEPLOYMENT_SETUP.md)**
   - Step-by-step setup guide
   - Deployment instructions
   - Troubleshooting guide

## Support

For issues during deployment:

1. Check error messages in Vercel logs
2. Test locally: `npm run build:admin`
3. Review documentation above
4. Check git commits for changes made

## Next Actions

1. ✅ Configuration files created and committed
2. ✅ Documentation written
3. 📋 Create separate Vercel project for admin app
4. 📋 Configure environment variables
5. 📋 Test both deployments
6. 📋 Set up custom domain (if using subdomain)
7. 📋 Monitor for issues in first week
