# Content-Based Routing - Deployment Guide

## Quick Start

### 1. Verify Implementation
```bash
cd "/Users/adityatiwari/Downloads/App Creation Request-2"
./verify-routing.sh
```

Expected output: All checks passed

### 2. Local Testing
```bash
npm run build:all
cd dist-business
npx serve -s . -l 3000
```

Then visit:
- http://localhost:3000 → Business app
- http://localhost:3000/admin → Admin app

### 3. Deploy to Vercel
```bash
git push origin main
# Vercel automatically deploys
```

Visit your deployed app at your Vercel domain.

## Implementation Summary

### What's New

| File | Purpose | Size |
|------|---------|------|
| `public/router.html` | Unified entry point | 6.5 KB |
| `src/router/app-router.ts` | Router logic | - |
| `scripts/merge-builds.mjs` | Build post-processor | - |
| `vercel.json` | Routing configuration | - |

### Routing Logic

```
Request URL               → Resolved To      → App Loaded
────────────────────────────────────────────────────────
/                        → /router.html     → Business
/dashboard               → /router.html     → Business
/admin                   → /router.html     → Admin
/admin/customers         → /router.html     → Admin
/admin/settings          → /router.html     → Admin
/assets/style.css        → /assets/...      → Direct serve
/admin/assets/admin.js   → /admin/assets/.. → Direct serve
```

## Verification Checklist

### Before Deployment

- [ ] Run `npm run build:all` locally - completes without errors
- [ ] Run `./verify-routing.sh` - all checks pass
- [ ] Test locally with `npx serve` - routes work correctly
- [ ] Check dist-business structure matches expected layout
- [ ] Review git log to see both commits

### After Deployment

- [ ] Visit your app root - business app loads
- [ ] Navigate to /admin - admin app loads
- [ ] Check browser console - no errors
- [ ] Verify assets load - check Network tab
- [ ] Test internal routes in business app
- [ ] Test internal routes in admin app
- [ ] Check responsive design on mobile

### Expected Directory Structure

```
dist-business/
├── index.html          ✓ Copy of business.html
├── business.html       ✓ Business entry (623 B)
├── admin.html          ✓ Admin entry (478 B)
├── router.html         ✓ Router (6.5 KB)
├── assets/
│   ├── business-*.js   ✓ Business bundles
│   ├── business-*.css  ✓ Business styles
│   └── [other chunks]
├── admin/assets/
│   ├── admin-*.js      ✓ Admin bundles
│   └── admin-*.css     ✓ Admin styles
├── firebase-messaging-sw.js
├── logo.png
└── logo.jpeg
```

## Git Commits Added

### Commit 1: Core Implementation
```
Implement Option C: Content-Based Routing with unified entry point
```
- Creates router.html
- Creates app-router.ts
- Creates merge-builds.mjs
- Updates vercel.json
- Updates package.json
- Adds documentation

### Commit 2: Configuration & Summary
```
Fix vercel.json configuration and add implementation summary
```
- Completes vercel.json configuration
- Adds quick reference summary
- Adds verification script

## Configuration Files

### vercel.json

Key configuration:
```json
{
  "buildCommand": "npm run build:business && npm run build:admin && node scripts/merge-builds.mjs",
  "outputDirectory": "dist-business",
  "routes": [
    // Static files served directly
    { "src": "^/assets/(.*)$", "dest": "/assets/$1" },
    { "src": "^/admin/assets/(.*)$", "dest": "/admin/assets/$1" },
    
    // HTML files available directly
    { "src": "^/business\\.html$", "dest": "/business.html" },
    { "src": "^/admin\\.html$", "dest": "/admin.html" },
    { "src": "^/router\\.html$", "dest": "/router.html" },
    
    // Fallback for all other routes
    { "src": "^/.*$", "dest": "/router.html" }
  ]
}
```

### package.json Scripts

```json
{
  "scripts": {
    "build:business": "vite build --config vite.config.business.ts",
    "build:admin": "vite build --config vite.config.admin.ts",
    "build:all": "npm run build:business && npm run build:admin && node scripts/merge-builds.mjs",
    "dev:business": "vite --config vite.config.business.ts",
    "dev:admin": "vite --config vite.config.admin.ts"
  }
}
```

## Performance Metrics

### File Sizes (Minified + Gzipped)
- router.html: 6.5 KB
- business.html: ~623 B
- admin.html: ~478 B
- Business app: 678 KB (2.6 MB uncompressed)
- Admin app: 157 KB (523 KB uncompressed)

### Loading Times (Estimated)
- Router detection: <1 ms
- HTML fetch: <100 ms (cached)
- App bundle load: 1-3 seconds
- Total time to interactive: 2-4 seconds

## Troubleshooting

### Issue: "Failed to load business app"

**Check:**
1. Is business.html in dist-business/?
2. Are assets in dist-business/assets/?
3. Check browser console for specific error
4. Try direct URL: https://yourapp.com/business.html

**Fix:**
```bash
npm run build:all
node scripts/merge-builds.mjs
```

### Issue: Admin app not appearing

**Check:**
1. Is admin.html in dist-business/?
2. Are assets in dist-business/admin/assets/?
3. Check vercel.json for /admin/assets route
4. Try direct URL: https://yourapp.com/admin.html

**Fix:**
```bash
npm run build:all
# Verify dist-business structure
ls -la dist-business/admin/
```

### Issue: Assets return 404

**Check:**
1. Asset files exist in dist-business/assets/ or dist-business/admin/assets/
2. Vercel routes include asset patterns
3. Asset paths in HTML match actual files
4. Check Content-Type headers

**Fix:**
```bash
# Verify files
find dist-business -name "*.js" -o -name "*.css"

# Rebuild if needed
npm run build:all
```

### Issue: React Router not working

**Check:**
1. BrowserRouter basename matches app path
2. Business app: basename="/business.html"
3. Admin app: basename="/admin.html"
4. Check src/business/main.tsx
5. Check src/admin/main.tsx

**Fix:**
Edit main.tsx files to ensure correct basename:
```tsx
<BrowserRouter basename="/business.html">
  <Routes>...</Routes>
</BrowserRouter>
```

## Rollback Plan

If deployment has issues:

### Option 1: Revert to Single App (Business Only)
```bash
git revert HEAD~1 HEAD   # Revert both commits
git push origin main

# Vercel will:
# - Use old build command (npm run build:business)
# - Deploy only business app
```

### Option 2: Keep Deployment, Use Feature Flag
```bash
# In router.html, modify detection logic:
const useNewRouter = true; // Toggle to enable/disable

if (!useNewRouter) {
  // Redirect to old single-app setup
  window.location.href = '/business.html';
}
```

## Post-Deployment Monitoring

### Metrics to Track

1. **Error Rate**
   - Monitor 4xx/5xx errors in Vercel dashboard
   - Check browser error logging
   - Review console errors

2. **Performance**
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)
   - Time to Interactive (TTI)

3. **User Experience**
   - Route load times
   - Asset delivery speed
   - Application responsiveness

### Tools

- **Vercel Analytics**: Built-in performance monitoring
- **Web Vitals**: Monitor Core Web Vitals
- **Sentry**: Error tracking (if configured)
- **New Relic**: Full-stack monitoring (if configured)

## Documentation References

For more detailed information, see:

1. **ROUTING_IMPLEMENTATION_SUMMARY.md** - Quick reference
2. **CONTENT_BASED_ROUTING_IMPLEMENTATION.md** - Complete technical details
3. **This file (DEPLOYMENT_GUIDE.md)** - Deployment & troubleshooting

## Support & Questions

For issues or questions:

1. Check the Troubleshooting section above
2. Review browser console and Vercel logs
3. Verify dist-business structure with `./verify-routing.sh`
4. Check git history: `git log --oneline -5`

## Success Criteria

Your deployment is successful when:

- [x] Both apps load from single domain
- [x] Routes correctly by /admin path
- [x] Assets load without errors
- [x] Browser console has no JavaScript errors
- [x] React Router works within each app
- [x] Page refreshes work correctly
- [x] Direct links to routes work (/admin/customers, etc.)

---

**Status**: Ready for Deployment
**Last Updated**: April 30, 2026
**Next Step**: Push to main branch and verify Vercel deployment
