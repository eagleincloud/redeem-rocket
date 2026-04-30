# Admin App Separate Deployment - Setup Guide

This guide walks through setting up a separate Vercel project for the admin application following the Option B deployment strategy.

## Quick Start

### Prerequisites
- Admin app already configured in `admin-app/` directory
- Vercel account with permission to create new projects
- `redeemrocket` Vercel project already exists (business app)

## Step-by-Step Setup

### 1. Prepare Admin App Directory

The admin app is already configured with:

✅ **admin-app/vercel.json** - Contains build and routing configuration
✅ **admin-app/.vercelignore** - Excludes unnecessary files
✅ **npm scripts** - `build:admin` and `dev:admin` available
✅ **vite.config.admin.ts** - Dedicated build configuration

### 2. Create New Vercel Project for Admin

#### Option A: Using Vercel CLI

```bash
cd admin-app

# Login to Vercel (if not already)
vercel login

# Deploy as new project
vercel --prod

# When prompted:
# - Project name: redeemrocket-admin
# - Framework: Vite
# - Root directory: ./ (current directory)
```

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select "Continue with GitHub" (or preferred provider)
4. Search for your repository
5. Click "Import"
6. Configure project settings:
   - **Project Name:** redeemrocket-admin
   - **Framework Preset:** Vite
   - **Root Directory:** ./admin-app
   - **Build Command:** npm run build:admin
   - **Output Directory:** dist-admin
   - **Install Command:** npm install

7. Click "Deploy"

### 3. Configure Environment Variables

In the Vercel project dashboard (redeemrocket-admin):

1. Go to Settings → Environment Variables
2. Add the following variables (same as business app):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

3. Click "Save"
4. Trigger a new deployment

### 4. Configure Custom Domain (Optional)

#### Option A: Subdomain (admin.redeemrocket.in)

1. In admin Vercel project settings → Domains
2. Click "Add"
3. Enter: `admin.redeemrocket.in`
4. Follow Vercel's DNS configuration instructions
5. Update DNS records at your domain registrar:
   - Add CNAME: `admin` → `cname.vercel-dns.com`

#### Option B: Use Vercel Domain

Admin app will be available at: `redeemrocket-admin.vercel.app`

### 5. Test Deployment

```bash
# Test business app still works
curl https://redeemrocket.in

# Test admin app
curl https://admin.redeemrocket.in
# OR
curl https://redeemrocket-admin.vercel.app
```

## Verification Checklist

- [ ] Admin Vercel project created and deployed
- [ ] Build logs show `npm run build:admin` executing
- [ ] Output directory shows `dist-admin/`
- [ ] Environment variables configured
- [ ] Custom domain configured (if using subdomain)
- [ ] Admin app loads without 404s
- [ ] Both apps share same Supabase backend
- [ ] Business app still accessible at original URL
- [ ] Admin routes properly handled (SPA fallback working)

## Common Issues & Solutions

### Issue: "dist-admin not found" error during build

**Solution:**
1. Check that `vite.config.admin.ts` exists
2. Verify the config has correct build output: `dist-admin`
3. Run locally: `npm run build:admin` to test
4. Check build command in Vercel project settings matches `npm run build:admin`

### Issue: Admin app returns 404 for all routes

**Solution:**
1. Verify `admin-app/vercel.json` has catch-all route:
   ```json
   {
     "src": "^/.*$",
     "dest": "/admin.html"
   }
   ```
2. Check that `dist-admin/admin.html` exists after build
3. Verify routing before static asset routes in vercel.json

### Issue: Assets return 404 (CSS, JS, images)

**Solution:**
1. Check asset routes in `admin-app/vercel.json` come BEFORE catch-all
2. Verify `dist-admin/assets/` directory exists
3. Check file names match in build output

### Issue: Shared services not working (Supabase, Firebase)

**Solution:**
1. Verify same environment variables in both Vercel projects
2. Check Supabase CORS settings allow both domains
3. Check Firebase allowed origins include admin domain
4. Test API calls in browser console

### Issue: Can't deploy - "vercel.json not found"

**Solution:**
1. Ensure `admin-app/vercel.json` exists
2. For CLI: navigate to `admin-app/` directory before running `vercel`
3. For dashboard: set "Root Directory" to `./admin-app` in project settings

## Local Development

### Build Both Apps Locally

```bash
# Build business app
npm run build:business
# Output: dist-business/

# Build admin app
npm run build:admin
# Output: dist-admin/
```

### Development Mode

```bash
# Terminal 1: Business app
npm run dev:business
# Runs on http://localhost:5173 (or configured port)

# Terminal 2: Admin app
npm run dev:admin
# Runs on different port
```

## Git Workflow

Both apps are in the same repository:

```
.
├── business-app/           # Business app source
├── admin-app/              # Admin app source
├── vercel.json            # Business app deployment (main project)
├── admin-app/vercel.json  # Admin app deployment (separate project)
└── package.json           # Shared npm scripts
```

### Deploying Changes

**Business App Only:**
```bash
git add business-app/
git commit -m "Update business app"
git push
# Vercel auto-deploys to redeemrocket project
```

**Admin App Only:**
```bash
git add admin-app/
git commit -m "Update admin app"
git push
# Vercel auto-deploys to redeemrocket-admin project
```

**Both Apps:**
```bash
git add business-app/ admin-app/
git commit -m "Update both business and admin apps"
git push
# Both Vercel projects auto-deploy
```

## Monitoring & Troubleshooting

### Check Deployment Status

```bash
# From root directory
vercel --prod
# From admin-app directory
cd admin-app && vercel --prod
```

### View Logs

```bash
# Business app logs
vercel logs redeemrocket

# Admin app logs
vercel logs redeemrocket-admin
```

### Trigger Manual Redeploy

1. Go to Vercel dashboard
2. Select project
3. Find latest deployment
4. Click "Redeploy" button

## Scaling Considerations

### Adding More Apps

This architecture supports adding more independent apps:

1. Create `customer-app/` directory with app source
2. Create `vite.config.customer.ts`
3. Add npm scripts: `build:customer`, `dev:customer`
4. Create `customer-app/vercel.json` with routing
5. Deploy to new Vercel project following same steps

### Shared Backend

All apps share the same:
- Supabase database
- Firebase authentication
- Storage infrastructure

No additional backend setup needed for new apps.

## Security Considerations

### Environment Variables
- Keep sensitive data (API keys) in Vercel project settings
- Do NOT commit to `.env` files in repository
- Each Vercel project has separate environment scope

### Domain Security
- Use HTTPS for all domains (automatic with Vercel)
- Keep DNS records updated
- Monitor Vercel security advisories

### Access Control
- Admin app should require authentication
- Verify user roles before displaying admin features
- Consider additional IP whitelisting if needed

## Next Steps

1. Create the separate Vercel project following steps above
2. Test both apps work independently
3. Update team documentation
4. Monitor deployments for first week
5. Set up automated backups of Supabase data

## Support

For issues:
1. Check `.github/DEPLOYMENT.md` for architecture overview
2. Review build logs in Vercel dashboard
3. Test locally with `npm run build:admin` and `npm run build:business`
4. Check Supabase and Firebase console for errors
