# 🎨 Theme System Deployment Guide

**Status**: Production Ready
**Date**: April 26, 2026
**Version**: 1.0

## Overview

The Redeem Rocket platform now includes a complete per-business theme system where each business receives a personalized, AI-generated theme during onboarding.

## Key Features

- **AI-Powered Generation**: Claude AI generates themes based on business type
- **Database Persistence**: Themes saved to `business_themes` table
- **CSS Variables**: Applied via 50+ CSS custom properties
- **Multi-Tenancy**: RLS ensures business isolation
- **Fallback Chain**: Database → localStorage → defaults
- **Customizable**: Users can adjust colors during onboarding

## Deployment Checklist

### 1. Verify Local Build ✅
```bash
npm run build:business
# Expected: dist-business/ created, zero errors
```
**Status**: ✅ VERIFIED

### 2. Configure GitHub Secrets (REQUIRED)

Go to: `https://github.com/eagleincloud/redeem-rocket/settings/secrets/actions`

#### Required Secrets:
1. **VERCEL_ORG_ID** - From https://vercel.com/account/settings
2. **VERCEL_PROJECT_ID** - From Vercel project settings
3. **VERCEL_TOKEN** - Generate from https://vercel.com/account/tokens
4. **VITE_SUPABASE_URL** - From Supabase project settings (format: https://xxxxx.supabase.co)
5. **VITE_SUPABASE_ANON_KEY** - From Supabase API keys

#### Using GitHub CLI:
```bash
gh secret set VERCEL_ORG_ID --body "team_xxxxx"
gh secret set VERCEL_PROJECT_ID --body "prj_xxxxx"
gh secret set VERCEL_TOKEN --body "your_token_here"
gh secret set VITE_SUPABASE_URL --body "https://xxxxx.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --body "eyJxxxxx"
```

**Status**: ⏳ PENDING - Requires manual configuration

### 3. Push to Production
```bash
git push origin main
```
**What happens**:
1. GitHub Actions workflow triggers
2. Runs: `npm run build:business`
3. Uploads to Vercel
4. Deployment completes in ~2-3 minutes
5. Live at: https://redeemrocket.in

### 4. Verify Production

Visit: `https://redeemrocket.in`
- ✅ Sign up works
- ✅ Onboarding flow completes
- ✅ AI theme generation succeeds
- ✅ Dashboard shows theme colors
- ✅ Theme persists on logout/login

## Success Criteria

Your theme system is production-ready when:

✅ All GitHub secrets configured
✅ Production build passes
✅ Signup → Onboarding → Theme generation works
✅ Dashboard displays business-specific theme
✅ Different businesses have different themes
✅ Theme persists across sessions
✅ No console errors in production

## Support

If issues occur:
1. Check GitHub Actions logs
2. Check Vercel deployment logs
3. Check Supabase edge function logs
4. Test locally first
5. Review browser console errors

---

**Next Step**: Configure GitHub secrets and push to main! 🚀
