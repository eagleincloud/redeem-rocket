# Edge Middleware Implementation for Dual-App Routing

## Overview

This document explains the implementation of Option D: Build Process Restructuring with Edge Middleware for dual-app routing. This approach uses Vercel's Edge Middleware to intelligently route requests between the admin and business applications.

## Why Edge Middleware?

### Comparison of Routing Approaches

| Aspect | vercel.json Routes | Serverless Functions | Edge Middleware |
|--------|-------------------|----------------------|-----------------|
| **Performance** | Moderate | Slower (cold starts) | Fastest (edge) |
| **Latency** | Regional | Regional + processing | Global (closest to user) |
| **Execution** | Origin server | Origin server | Edge network |
| **Cost** | Free | Compute cost | Pro+ plan required |
| **Complexity** | Simple rules only | Full code capability | Moderate code |
| **Cache behavior** | Good | Limited | Excellent |

### Why We Chose Edge Middleware

1. **Performance**: Runs at Vercel's edge network (globally distributed), closest to users = lowest latency
2. **Cost-effective**: No additional compute costs compared to serverless functions
3. **Official pattern**: Vercel's recommended approach for complex routing scenarios
4. **Powerful**: Can inspect headers, query parameters, cookies, and request metadata
5. **Faster than alternatives**: No cold starts, no origin server latency overhead

## Architecture

### Request Flow

```
User Request
    ↓
Vercel Edge (worldwide)
    ↓
Edge Middleware (vercel/middleware.ts)
    ↓
    ├─ /admin/* → Rewrite to /admin.html (admin app)
    │   └─ Set x-app-context: admin header
    │
    ├─ /assets/* → Pass through (business app assets)
    │
    ├─ /admin/assets/* → Pass through (admin app assets)
    │
    ├─ / or /app/* → Rewrite to /business.html (business app)
    │   └─ Set x-app-context: business header
    │
    └─ Static files → Pass through
        (favicon.svg, manifest.json, etc.)
    ↓
Origin Server (dist-business/)
    ↓
SPA Router (handles client-side routing)
    ↓
Browser
```

### Build Process Flow

```
npm run build (or: bash scripts/build-separate.sh)
    ↓
    ├─ npm run build:business → vite build --config vite.config.business.ts
    │   └─ Output: dist-business/
    │       ├─ business.html
    │       ├─ index.html (copy of business.html)
    │       └─ assets/
    │
    ├─ npm run build:admin → vite build --config vite.config.admin.ts
    │   └─ Output: dist-admin/
    │       ├─ admin.html
    │       └─ assets/
    │
    └─ node scripts/merge-builds.mjs
        └─ Merge into dist-business/
            ├─ Copy admin.html
            ├─ Copy admin/assets/
            ├─ Copy router.html
            └─ Verify structure
    ↓
dist-business/ (ready for deployment)
    ├─ index.html (SPA entry, matches business.html)
    ├─ business.html (business app entry)
    ├─ admin.html (admin app entry)
    ├─ router.html (legacy fallback)
    ├─ assets/ (business app assets)
    └─ admin/assets/ (admin app assets)
    ↓
Deploy to Vercel
    ↓
Vercel Edge Middleware routes requests
```

## Files Modified/Created

### New Files

1. **`vercel/middleware.ts`**
   - Vercel Edge Middleware implementation
   - Handles all routing logic
   - Runs before requests reach origin server

2. **`scripts/build-separate.sh`**
   - Shell script for building both apps separately
   - Verifies build success
   - Provides detailed output reporting

### Modified Files

1. **`package.json`**
   - Updated `build` script to use new build script
   - Updated `build:all` to use new build script
   - Updated vercel.json buildCommand

2. **`vercel.json`**
   - Removed complex routes array
   - Added middleware configuration
   - Simplified to use Edge Middleware

## Routing Rules

### Admin App Routes (`/admin/*`)

```
Request: /admin
→ Rewritten to: /admin.html
→ Set header: x-app-context: admin

Request: /admin/users
→ Rewritten to: /admin.html
→ Handled by React Router (SPA)
→ Set header: x-app-context: admin

Request: /admin/assets/chunk-abc123.js
→ Served directly from dist-business/admin/assets/
→ No rewrite
```

### Business App Routes

```
Request: /
→ Rewritten to: /business.html
→ Set header: x-app-context: business

Request: /app/dashboard
→ Rewritten to: /business.html
→ Handled by React Router (SPA)
→ Set header: x-app-context: business

Request: /assets/chunk-xyz789.css
→ Served directly from dist-business/assets/
→ No rewrite
```

### Static Files

```
Request: /favicon.svg
→ Served directly (no rewrite)

Request: /firebase-messaging-sw.js
→ Served directly (no rewrite)

Request: /manifest.json
→ Served directly (no rewrite)
```

## Local Development

### Development Mode (for testing)

```bash
# Terminal 1: Business app
npm run dev:business

# Terminal 2: Admin app
npm run dev:admin
```

**Note**: Edge Middleware only works on Vercel deployment. Local development uses Vite's built-in middleware (configured in vite.config files).

### Simulate Vercel Locally

```bash
npm run build
vercel dev
```

This simulates the Vercel environment including Edge Middleware (if you have Vercel CLI installed).

## Deployment

### Prerequisites

- Vercel Pro plan or above (Edge Middleware requires Pro)
- Git repository (GitHub, GitLab, Bitbucket)

### Deploy Steps

1. **Push to your Git repository**
   ```bash
   git add .
   git commit -m "Implement Edge Middleware for dual-app routing"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Via Vercel UI: Import project → Select main branch → Deploy
   - Via Vercel CLI: `vercel deploy`

3. **Verify Routing**
   - Visit https://your-domain.vercel.app → Should load business app
   - Visit https://your-domain.vercel.app/admin → Should load admin app
   - Check Network tab → Should see requests rewritten by middleware

### Build Command

The build command in `vercel.json` is now:
```
npm run build
```

Which runs:
```bash
bash scripts/build-separate.sh
```

Which in turn:
1. Builds business app to `dist-business/`
2. Builds admin app to `dist-admin/`
3. Merges outputs using `scripts/merge-builds.mjs`

## Debugging Edge Middleware

### View Middleware Logs

1. In Vercel Dashboard:
   - Navigate to project → Deployments → Select a deployment
   - Click "Logs" → View "Edge Middleware" logs

2. Via Vercel CLI:
   ```bash
   vercel logs
   ```

### Common Issues

#### Admin app not loading at `/admin`

**Symptom**: `/admin` loads business app instead of admin app

**Causes**:
- admin.html not copied to dist-business
- Middleware path pattern doesn't match /admin
- Browser cache serving old HTML

**Solution**:
1. Verify admin.html exists: `ls dist-business/admin.html`
2. Check middleware.ts matches `/admin` paths
3. Hard refresh browser: Ctrl+Shift+R or Cmd+Shift+R
4. Check Vercel logs for middleware errors

#### Assets not loading

**Symptom**: CSS/JS files 404, app looks broken

**Causes**:
- Asset paths incorrect in vite config
- Assets not copied to correct location
- Browser cache issues

**Solution**:
1. Verify asset structure:
   ```bash
   ls -la dist-business/assets/
   ls -la dist-business/admin/assets/
   ```
2. Check network tab in DevTools for actual paths
3. Ensure vite configs output to correct directories
4. Clear browser cache

#### Middleware not executing

**Symptom**: Routes not rewritten, page handling wrong

**Causes**:
- Not deployed (local testing)
- Middleware file not included in build
- Vercel plan doesn't support middleware

**Solution**:
1. Only Edge Middleware works on Vercel deployment
2. For local testing, use `vercel dev`
3. Verify Vercel Pro plan is active
4. Check Vercel logs for deployment status

### Check Current Routing

```bash
# After deployment, verify routing with curl
curl -i https://your-domain.vercel.app/admin
# Look for x-app-context header in response

curl -i https://your-domain.vercel.app/
# Look for x-app-context: business header
```

## Performance Characteristics

### Cold Start Impact

- **Middleware**: ~5-10ms (minimal)
- **Serverless function**: ~100-500ms
- **No middleware**: Instant (but no routing)

### Cache Behavior

Edge Middleware works with Vercel's caching:
- Static assets (CSS, JS) → Cached at edge
- HTML rewrites → Not cached (always fresh)
- Can add custom Cache-Control headers in middleware

### Latency by Region

With Edge Middleware:
- US: ~10-20ms
- Europe: ~15-25ms
- Asia: ~20-40ms

(Varies by distance to nearest Vercel edge location)

## Future Enhancements

### Potential Improvements

1. **Request logging**
   - Add custom logging to middleware
   - Track routing patterns
   - Monitor unusual traffic

2. **AB Testing**
   - Route percentage of traffic to new versions
   - Test new features safely
   - Geographic routing

3. **Authentication**
   - Check auth headers before routing
   - Redirect unauthorized /admin requests
   - Implement CORS policies

4. **Rate limiting**
   - Limit requests at edge
   - Prevent abuse early
   - No load on origin server

### Example: Rate Limiting

```typescript
// Add to middleware.ts
const limit = 100; // requests per minute
if (requestCount > limit) {
  return new NextResponse('Too many requests', { status: 429 });
}
```

## Troubleshooting Checklist

- [ ] Both dist-business/ and dist-admin/ build successfully
- [ ] admin.html copied to dist-business/
- [ ] admin/assets/ directory exists in dist-business/
- [ ] vercel/middleware.ts file exists
- [ ] Vercel Pro plan or above active
- [ ] Deployed to Vercel (not local)
- [ ] Hard refresh browser after deployment
- [ ] Check Vercel logs for errors
- [ ] Verify x-app-context header in Network tab

## References

- [Vercel Edge Middleware Docs](https://vercel.com/docs/functions/edge-middleware)
- [Middleware API Reference](https://vercel.com/docs/functions/edge-middleware/middleware-api)
- [Vercel Routing Guide](https://vercel.com/docs/routing)
- [NextRequest API](https://vercel.com/docs/functions/edge-middleware/middleware-api#nextrequest)

## Comparison with Previous Implementation

### Before (vercel.json routes)

```json
{
  "routes": [
    { "src": "^/admin/.*$", "dest": "/admin.html" },
    { "src": "^/.*$", "dest": "/business.html" }
  ]
}
```

**Issues**:
- Limited routing logic
- Can't inspect headers/cookies
- No request transformation
- Complex regex patterns

### After (Edge Middleware)

```typescript
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL('/admin.html', request.url));
  }
  return NextResponse.rewrite(new URL('/business.html', request.url));
}
```

**Benefits**:
- Full JavaScript logic capability
- Can inspect/modify request headers
- Clear, maintainable code
- Composable patterns

## Summary

Edge Middleware provides the optimal routing solution for dual-app deployments:

✅ **Fastest**: Runs at Vercel edge globally  
✅ **Official**: Vercel's recommended pattern  
✅ **Powerful**: Full request introspection  
✅ **Simple**: Clear, maintainable code  
✅ **Scalable**: Works at any scale  

Deployment is straightforward and provides instant benefits to users worldwide through improved latency.
