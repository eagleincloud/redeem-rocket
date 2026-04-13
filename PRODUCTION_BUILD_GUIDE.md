# Production Build Guide - Redeem Rocket Business App

**Purpose:** Build and deploy Business App to Vercel for production
**Date:** April 7, 2026
**Status:** Ready for production build

---

## 🚀 PRODUCTION BUILD STEPS

### Step 1: Pre-Build Verification

```bash
# 1. Navigate to project root
cd "/Users/adityatiwari/Downloads/App Creation Request-2"

# 2. Verify Node.js and npm are installed
node --version
npm --version

# 3. Install dependencies (if not done)
npm install

# 4. Verify all environment variables are set
cat .env | grep VITE_

# Expected output:
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyxxxx...
# (and other variables)
```

---

### Step 2: Run Build Command

```bash
# Build for production
npm run build:business

# Expected output:
#
# ✓ 1234 modules transformed
# dist/index.html                 12.5 kb │ gzip: 4.2 kb
# dist/assets/index-xxxxx.js    245.3 kb │ gzip: 62.4 kb
#
# ✓ built in 12.34s
```

### What Gets Built

```
dist/
├── index.html           ← Entry point
├── business.html        ← For basename routing
├── assets/
│   ├── index-xxxxx.js   ← Bundled JavaScript
│   └── index-xxxxx.css  ← Bundled CSS
└── logo.png             ← Static assets
```

---

### Step 3: Verify Build Output

```bash
# Check build output exists
ls -lah dist/

# Should show:
# -rw-r--r--  12 May  7 dist/index.html
# -rw-r--r-- 245 May  7 dist/assets/index-xxxxx.js
# -rw-r--r--  62 May  7 dist/assets/index-xxxxx.css
# ... (other files)

# Get total size
du -sh dist/

# Expected: 300-400 KB (should be < 500 KB)
```

---

### Step 4: Test Build Locally (Optional but Recommended)

```bash
# Install a simple HTTP server
npm install -g http-server

# Serve the dist folder
http-server dist/ -p 8080

# Open browser: http://localhost:8080/business.html

# Test:
# 1. Login flow works
# 2. All pages load
# 3. No console errors
# 4. Assets load correctly

# Stop server when done
# Ctrl+C
```

---

## 📦 VERCEL DEPLOYMENT

### Method 1: Using Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy the built version
vercel --prod

# 4. When prompted:
#    - Project name: redeemrocket-business
#    - Framework: Vite
#    - Root directory: .
#    - Build command: npm run build:business
#    - Output directory: dist

# 5. Wait for deployment
#    Expected time: 2-3 minutes

# 6. Get URL from output
#    https://redeemrocket-business.vercel.app
```

### Method 2: Using Vercel Web Dashboard

```
1. Go to: https://vercel.com/dashboard
2. Click "New Project"
3. Import GitHub repository:
   - Select: App Creation Request-2
   - Name: redeemrocket-business
4. Configure Build Settings:
   - Framework: Vite
   - Build Command: npm run build:business
   - Output Directory: dist
5. Set Environment Variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - (all other VITE_* variables)
6. Click "Deploy"
7. Wait for completion (~2-3 minutes)
8. Get production URL from Vercel dashboard
```

---

## 🔐 ENVIRONMENT VARIABLES ON VERCEL

### Required Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyxxxx...
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_MSG91_AUTH_KEY=xxxxx
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxxx
VITE_FIREBASE_PROJECT_ID=xxxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
VITE_FIREBASE_APP_ID=xxxxx
```

### How to Set Variables in Vercel

```
1. Go to Vercel Project Settings
2. Click "Environment Variables"
3. For each variable:
   - Name: (e.g., VITE_SUPABASE_URL)
   - Value: (paste the actual value)
   - Check: Production
   - Check: Preview
   - Check: Development
4. Click "Save"
5. Redeploy the project (so new vars take effect)
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Check 1: Website Loads

```
1. Open production URL in browser
2. Should see login page
3. No "404 Not Found" errors
4. No "Cannot find module" errors
5. Supabase connection works
```

### Check 2: Authentication Works

```
1. Complete login flow
   - Enter email
   - Verify OTP
   - Should complete

2. Onboarding flow
   - New user should see onboarding
   - Existing user should skip to dashboard

3. Dashboard loads
   - Should display normally
   - All charts/widgets work
```

### Check 3: All Pages Work

```
For each page (19 total):
1. Click in sidebar
2. Page should load
3. No errors in console
4. Correct URL shows

Test a few critical pages:
- Dashboard
- Products
- Orders
- Team
- Analytics
```

### Check 4: Error Handling

```
1. Try accessing undefined page
2. Error popup should show
3. Error message is helpful
4. "Refresh" and "Go Home" buttons work
```

### Check 5: Features Work

```
1. Upload a photo
   - Should work
   - Image should display

2. Create a product
   - Form should work
   - Save should work

3. Team members
   - Should be visible from onboarding
   - Can add new members
```

---

## 🐛 COMMON DEPLOYMENT ISSUES & FIXES

### Issue 1: "Cannot find module X"

**Cause:** Environment variable not set or import path wrong

**Fix:**
```bash
# Verify in .env
grep "VITE_" .env

# Verify in Vercel dashboard
# Settings → Environment Variables

# Rebuild and redeploy
vercel --prod --force
```

---

### Issue 2: "Supabase connection failed"

**Cause:** Environment variables not set correctly

**Fix:**
```
1. Check Vercel dashboard → Environment Variables
2. Verify VITE_SUPABASE_URL is correct
3. Verify VITE_SUPABASE_ANON_KEY is correct
4. Redeploy: vercel --prod --force
```

---

### Issue 3: "404 Not Found" on routes

**Cause:** Missing routing configuration for SPA

**Fix:**
```
1. Create vercel.json in project root:

{
  "rewrites": [
    {
      "source": "/business.html/:path*",
      "destination": "/business.html"
    }
  ]
}

2. Rebuild and redeploy
vercel --prod --force
```

---

### Issue 4: "Blank page or white screen"

**Cause:** JavaScript not loading or error

**Fix:**
```
1. Open DevTools Console (F12)
2. Check for errors
3. Check Network tab for failed requests
4. Verify environment variables
5. Verify build output files exist
```

---

### Issue 5: "Styles not loading"

**Cause:** CSS file path wrong

**Fix:**
```
1. Check Network tab
2. Look for failed CSS requests
3. Verify import paths in code
4. Check that CSS builds correctly
5. Rebuild: npm run build:business
```

---

## 📊 BUILD CONFIGURATION

### Vite Config for Production

File: `vite.config.business.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,        // Disable for production
    minify: 'terser',        // Minify for smaller bundle
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-router'],
        }
      }
    }
  }
});
```

### Build Output Optimization

```
Build Statistics:
- JavaScript: ~245 KB (minified)
- CSS: ~62 KB (minified)
- Images: ~10 KB
- Total: ~317 KB

After gzip:
- Total: ~85 KB

Load time estimate:
- Fast connection: < 1 second
- Slow 3G: 2-3 seconds
```

---

## 🔍 MONITORING & LOGS

### Vercel Analytics

```
1. Go to Vercel dashboard
2. Select project
3. Click "Analytics"
4. Monitor:
   - Page load times
   - Error rates
   - Visitor count
   - Deployment history
```

### Application Logs

```
1. Vercel → Project → Deployments
2. Click latest deployment
3. View Logs:
   - Build logs (npm run build:business output)
   - Function logs (if using API routes)
   - Runtime errors
```

### Error Tracking

```
1. Monitor browser console for errors
2. Set up error tracking:
   - Sentry (optional)
   - LogRocket (optional)
   - Vercel Analytics (built-in)
```

---

## 🚀 PRODUCTION CHECKLIST

```
PRE-BUILD:
☐ All code committed to git
☐ .env file has all variables
☐ No console warnings or errors
☐ All tests pass
☐ Build command works locally

BUILD:
☐ npm run build:business completes successfully
☐ dist/ folder created
☐ No build errors or warnings
☐ Bundle size is reasonable (< 500 KB)

DEPLOYMENT:
☐ Environment variables set in Vercel
☐ Deployment successful (Vercel shows ✓)
☐ Production URL accessible
☐ HTTPS enabled (automatic)
☐ Domain configured (if using custom domain)

POST-DEPLOYMENT:
☐ Website loads without errors
☐ Authentication flows work
☐ All 19 pages accessible
☐ Error handling works
☐ Features function correctly
☐ Mobile responsive
☐ Performance acceptable
☐ No console errors in prod
```

---

## 📈 PERFORMANCE OPTIMIZATION

### Already Optimized

```
✓ Code minification (Vite)
✓ CSS minification (Vite)
✓ Tree shaking (unused code removal)
✓ Lazy loading (React.lazy)
✓ Code splitting (automatic)
✓ Asset compression (Vercel)
✓ CDN distribution (Vercel)
```

### Optional Further Optimization

```
1. Image optimization
   - Compress PNGs/JPGs
   - Use WebP format

2. Font optimization
   - Use system fonts
   - Subset Unicode

3. Bundle analysis
   - npm run build:business -- --analyze
   - Remove unused libraries

4. Caching headers
   - Set in vercel.json
   - Cache assets for 1 year
   - Cache HTML for 1 hour
```

---

## 🔗 CUSTOM DOMAIN (Optional)

If you have a custom domain:

```
1. Vercel Dashboard → Project Settings
2. Domains
3. Add custom domain
4. Follow DNS configuration
5. Wait for SSL certificate (auto-generated)
6. Update links to use new domain
```

---

## 📞 SUPPORT & ROLLBACK

### If Deployment Fails

```bash
# Check logs
vercel logs

# Rollback to previous version
# Vercel dashboard → Deployments → Select previous → "Promote to Production"

# Or redeploy
vercel --prod --force
```

### If Production Has Issues

```bash
1. Check error logs
2. Verify environment variables
3. Check Supabase status
4. Review recent code changes
5. Rollback if necessary
6. Fix and redeploy
```

---

## 🎯 DEPLOYMENT SUMMARY

### Quick Deploy (for future)

```bash
# 1. Make code changes
# 2. Commit to git (git commit -am "message")
# 3. Deploy
npm run build:business && vercel --prod
```

### Automated Deployment (GitHub)

```
1. Connect GitHub to Vercel
2. Vercel auto-deploys on git push
3. No manual deployment needed
4. Automatic production deployments on main branch
```

---

## ✅ VERIFICATION COMMANDS

```bash
# Verify build output
ls -lah dist/

# Verify no build errors
npm run build:business 2>&1 | grep -i "error"

# Get build statistics
du -sh dist/

# List all files in dist
tree dist/ || find dist/ -type f
```

---

## 📋 DEPLOYMENT TIMELINE

| Step | Time | Status |
|------|------|--------|
| Setup & verification | 5 min | ⏳ |
| Build process | 2 min | ⏳ |
| Vercel deployment | 3 min | ⏳ |
| Post-deployment checks | 10 min | ⏳ |
| **Total** | **20 min** | ⏳ |

---

## 🎉 SUCCESS CRITERIA

Deployment is successful when:

```
✅ Build completes without errors
✅ Vercel shows "Ready" status
✅ Production URL loads
✅ No console errors
✅ Authentication works
✅ All pages load
✅ Database connection works
✅ Responsive on mobile
✅ Performance acceptable
✅ Errors display correctly
```

---

**Ready to deploy!** Follow the steps above for production deployment.
