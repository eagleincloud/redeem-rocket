# Deployment Guide: Edge Middleware Setup

## Quick Start

### 1. Build Locally

```bash
npm run build
```

This will:
- Build business app to `dist-business/`
- Build admin app to `dist-admin/`
- Merge outputs with admin.html and admin/assets/
- Verify all required files exist

Expected output:
```
================================================================
Build Verification
================================================================

✓ dist-business directory exists
  ✓ index.html
  ✓ business.html
  ✓ assets/
✓ dist-admin directory exists
  ✓ admin.html
  ✓ assets/
✓ Merged: admin.html in dist-business
✓ Merged: admin/assets/ in dist-business

Build completed successfully!
```

### 2. Test Locally with Vercel

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Run local preview
vercel dev
```

Then visit:
- http://localhost:3000 → Business app
- http://localhost:3000/admin → Admin app
- http://localhost:3000/assets/... → Business assets
- http://localhost:3000/admin/assets/... → Admin assets

### 3. Deploy to Vercel

#### Option A: Via Vercel UI

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Project Settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist-business`
5. Deploy

#### Option B: Via Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy
vercel deploy

# Link to existing project
vercel link
vercel deploy --prod
```

#### Option C: Via Git Push

1. Connect repository to Vercel
2. Vercel automatically deploys on push
3. Check Vercel dashboard for status

### 4. Verify Deployment

After deployment, test these routes:

```bash
# Business app (default)
curl https://your-domain.vercel.app/
curl https://your-domain.vercel.app/app/dashboard

# Admin app
curl https://your-domain.vercel.app/admin
curl https://your-domain.vercel.app/admin/users

# Assets
curl https://your-domain.vercel.app/assets/chunk-abc123.js
curl https://your-domain.vercel.app/admin/assets/chunk-abc123.js
```

## Vercel Project Configuration

### Required Settings

In `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist-business",
  "installCommand": "npm install"
}
```

## Plan Requirements

**Edge Middleware requires Vercel Pro or higher**

- **Vercel Pro**: $20/month - Includes Edge Middleware
- **Vercel Enterprise**: Custom pricing - Full support

## Troubleshooting Deployment

### Build Fails

**Check build logs**:
1. Vercel Dashboard → Deployments → Failed deployment
2. Click "View Build Logs"
3. Look for error messages

### Routing Not Working

**Check Edge Middleware logs**:
1. Vercel Dashboard → Deployments → Select latest
2. Click "Logs" tab
3. Filter by "Edge Middleware"

### Assets Not Loading

**Verify structure locally**:
```bash
ls dist-business/assets/
ls dist-business/admin/assets/
```

## Deployment Checklist

- [ ] `npm run build` succeeds locally
- [ ] `vercel dev` works locally
- [ ] Vercel Pro or higher plan active
- [ ] Git repository connected to Vercel
- [ ] Build settings correct
- [ ] Edge Middleware logs show successful execution
- [ ] /admin routes load admin app
- [ ] / and /app routes load business app
- [ ] Assets load correctly
