# GitHub Actions & Vercel Deployment Setup Guide

## Fixed Issues

✅ **Build command mismatch** - Test now runs `npm run build:business` (matches Vercel)
✅ **.vercel cleanup issue** - No longer deletes .vercel directory (keeps project context)
✅ **Missing --confirm flag** - Added to Vercel CLI call (prevents hanging in CI)
✅ **Workflow logic** - PR comments only run on pull_request events
✅ **Build verification** - Added step to verify dist-business output exists

---

## Required GitHub Repository Secrets

You **MUST** configure these 5 secrets in your GitHub repository for deployment to work:

### 1. **VERCEL_ORG_ID**
- **What it is**: Your Vercel account/team ID
- **Where to find it**: 
  - Go to https://vercel.com/account/settings
  - Scroll to "Team ID" or "Account ID"
  - Copy the ID (format: `team_xxxxx` or similar)
- **Store as**: GitHub secret named `VERCEL_ORG_ID`

### 2. **VERCEL_PROJECT_ID**
- **What it is**: Your specific Vercel project ID
- **Where to find it**:
  - Go to https://vercel.com/dashboard
  - Click on your project "app-creation-request-2"
  - Go to Settings → General
  - Copy "Project ID" (format: `prj_xxxxx`)
- **Store as**: GitHub secret named `VERCEL_PROJECT_ID`

### 3. **VERCEL_TOKEN**
- **What it is**: API token for Vercel authentication
- **Where to find it**:
  - Go to https://vercel.com/account/tokens
  - Click "Create Token"
  - Name it: "GitHub Actions Deployment"
  - Copy the token immediately (you can't see it again)
- **Scopes needed**:
  - ✅ Full Access (for simplicity)
  - OR ✅ Limited to specific project (more secure)
- **Store as**: GitHub secret named `VERCEL_TOKEN`

### 4. **VITE_SUPABASE_URL**
- **What it is**: Your Supabase project URL
- **Where to find it**:
  - Go to https://supabase.com/dashboard
  - Click on your project
  - Settings → API → Project URL (format: `https://xxxxx.supabase.co`)
- **Store as**: GitHub secret named `VITE_SUPABASE_URL`

### 5. **VITE_SUPABASE_ANON_KEY**
- **What it is**: Your Supabase public/anon key
- **Where to find it**:
  - Go to https://supabase.com/dashboard
  - Click on your project
  - Settings → API → anon public key
- **Store as**: GitHub secret named `VITE_SUPABASE_ANON_KEY`

---

## How to Set GitHub Secrets

### Via GitHub Web UI

1. Go to: `https://github.com/eagleincloud/redeem-rocket/settings/secrets/actions`
2. Click **"New repository secret"**
3. For each secret:
   - **Name**: (from list above)
   - **Value**: (copy from Vercel/Supabase)
   - Click **"Add secret"**

### Via GitHub CLI (Faster)

```bash
# Replace with your actual values
gh secret set VERCEL_ORG_ID --body "team_xxxxx"
gh secret set VERCEL_PROJECT_ID --body "prj_xxxxx"
gh secret set VERCEL_TOKEN --body "your_token_here"
gh secret set VITE_SUPABASE_URL --body "https://xxxxx.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --body "eyJxxxxx"
```

---

## Verification Checklist

After setting up secrets, verify everything works:

- [ ] All 5 secrets configured in GitHub Settings → Secrets & Variables → Actions
- [ ] VERCEL_TOKEN has not expired
- [ ] VERCEL_ORG_ID matches your Vercel account
- [ ] VERCEL_PROJECT_ID matches your "app-creation-request-2" project
- [ ] Supabase secrets are for the correct project (not a different environment)

---

## Testing the Deployment

1. **Push to main branch**:
   ```bash
   git add .github/workflows/prod-deploy.yml
   git commit -m "fix: corrected GitHub Actions workflow for Vercel deployment"
   git push origin main
   ```

2. **Monitor deployment**:
   - Go to: `https://github.com/eagleincloud/redeem-rocket/actions`
   - Watch the "Deploy to Production" workflow run
   - Look for green checkmarks ✅

3. **Expected workflow stages**:
   ```
   ✅ test job
      - Checkout code
      - Setup Node 18
      - Install dependencies
      - Run npm run build:business
      - Verify dist-business exists
   
   ✅ deploy-prod job (runs after test passes)
      - Checkout code
      - Setup Node 18
      - Install dependencies
      - Deploy to Vercel with --prod --confirm
   ```

4. **Verify production deployment**:
   - Visit: https://redeemrocket.in/
   - Check that latest features are live
   - Check browser console for errors

---

## Troubleshooting

### "Error: Could not retrieve Project Settings"
**Cause**: Wrong VERCEL_PROJECT_ID or VERCEL_ORG_ID
**Fix**: Verify IDs match your Vercel project settings

### "Error: Authentication failed"
**Cause**: VERCEL_TOKEN expired or invalid
**Fix**: Generate new token at https://vercel.com/account/tokens

### "Deploy timed out"
**Cause**: Missing --confirm flag (old workflow was hanging)
**Fix**: Already fixed in new workflow

### "dist-business not found"
**Cause**: Build command failed
**Fix**: Check test job logs - should show build errors

---

## Workflow Explanation

### Test Job (`test`)
1. Checks out code
2. Installs dependencies
3. **Builds business app** with `npm run build:business`
4. **Verifies output** in `dist-business` directory
5. If any step fails → deployment is cancelled

### Deploy Job (`deploy-prod`)
- **Only runs if**: 
  - Test job passed ✅
  - Event is a `push` to `main` branch
  
- **Deployment steps**:
  1. Installs Vercel CLI globally
  2. Deploys using:
     ```
     vercel deploy --prod --confirm
     ```
  3. Uses environment variables for auth
  4. Vercel builds using `vercel.json` config

### Why These Fixes Work

| Issue | Fix | Why It Works |
|-------|-----|------------|
| Build mismatch | Test runs `build:business` like Vercel | Test validates exactly what production uses |
| .vercel deletion | Keep .vercel directory | Vercel knows which project to deploy to |
| Missing --confirm | Added to vercel CLI call | CI doesn't hang waiting for user input |
| No verification | Added output directory check | Catches build failures before deploy attempt |
| Secrets not set | Setup guide provided | All required auth configured |

---

## Next Steps

1. **Set all 5 GitHub secrets** (using web UI or CLI)
2. **Push the fixed workflow** to main branch
3. **Monitor GitHub Actions** for successful deployment
4. **Verify** production site is live and updated

After that, every push to `main` will automatically:
- ✅ Test the build
- ✅ Deploy to Vercel production
- ✅ Update https://redeemrocket.in/
