# Vercel Deployment Setup for www.redeemrocket.in

**Date:** April 14, 2026  
**Target Domain:** www.redeemrocket.in  
**Vercel Email:** aditya2tfb@gmail.com  
**Project:** app-creation-request-2  
**Git Repository:** https://github.com/eagleincloud/redeem-rocket

---

## Current Status

✅ **Code:** All features committed and pushed to `origin/main`
- Business app improvements (email outreach, team auth, help system)
- Password reset flow with OTP
- Latest commit: b61554b

✅ **Vercel Project:** app-creation-request-2 exists
- Currently deployed at: https://app-creation-request-2.vercel.app
- Build config: `npm run build:business`
- Output: `dist-business`

⏳ **Next Steps:** Add custom domain www.redeemrocket.in

---

## Step-by-Step Deployment Instructions

### 1️⃣ Configure Custom Domain in Vercel

**URL:** https://vercel.com/dashboard

```
1. Login with: aditya2tfb@gmail.com
2. Select project: "app-creation-request-2"
3. Go to: Settings → Domains
4. Click: "Add Domain"
5. Enter: www.redeemrocket.in
6. Click: "Continue"
```

### 2️⃣ Configure DNS (Choose One Option)

#### **Option A: Update Nameservers (Recommended)**
```
Vercel will show you 4 nameservers:
- ns1.vercel-dns.com
- ns2.vercel-dns.com
- ns3.vercel-dns.com
- ns4.vercel-dns.com

Go to your domain registrar (GoDaddy, NameCheap, etc.)
1. Find: Nameserver settings
2. Replace existing nameservers with Vercel's
3. Save changes
4. Wait 24-48 hours for DNS propagation

⚠️  This will point ALL subdomains to Vercel
```

#### **Option B: Add CNAME Record**
```
Vercel will show you a CNAME target, typically:
cname.vercel.app

Go to your domain registrar:
1. Find: DNS Records or CNAME settings
2. Add new CNAME record:
   - Name/Host: www
   - Value: cname.vercel.app
3. Save changes
4. Wait 15-30 minutes for DNS propagation

✅ This keeps other records intact
```

### 3️⃣ Verify Domain in Vercel

Once DNS is configured:
```
1. Vercel automatically verifies
2. Takes 5-15 minutes after DNS propagates
3. Status changes from "Pending" to "Valid"
4. Certificate (HTTPS) auto-generated
```

### 4️⃣ Update Environment Variables

In Vercel Dashboard, go to Settings → Environment Variables

Add/Update:
```
APP_BASE_URL = https://www.redeemrocket.in
VITE_APP_URL = https://www.redeemrocket.in
```

Production environment only.

### 5️⃣ Verify Deployment

Once domain is active:

```bash
# Check DNS resolution
nslookup www.redeemrocket.in

# Visit app
https://www.redeemrocket.in

# Test features
- Login page loads
- Password reset works
- Email outreach accessible
- Help system shows
```

---

## Branch Protection & Auto-Deploy

Current setup:
- All pushes to `origin/main` auto-deploy to Vercel
- Domain www.redeemrocket.in will serve latest deployment
- SSL/TLS certificate auto-managed by Vercel

---

## Rollback Plan

If something breaks:
```
1. Go to Vercel Dashboard
2. Select project
3. Go to Deployments
4. Click previous working deployment
5. Click "Promote to Production"
```

---

## Final DNS Records (After Setup)

Your DNS should look like this:

```
Type    | Name    | Value
--------|---------|----------------------------------
CNAME   | www     | cname.vercel.app
A       | @       | (Vercel's IP - auto-configured)
```

Or if using nameservers, ALL records point to Vercel.

---

## Support

If domain doesn't work after 24 hours:
1. Clear browser cache (Ctrl+Shift+Del)
2. Check DNS propagation: https://dnschecker.org/
3. Verify Vercel domain status shows "Valid"
4. Check console logs for errors

---

## Timeline

| Step | Time | Who |
|------|------|-----|
| Configure domain in Vercel | 5 min | Aditya |
| Configure DNS at registrar | 5 min | Aditya |
| DNS propagation | 15 min - 24 hours | ISP |
| Vercel verification | Auto | Vercel |
| App live at www.redeemrocket.in | After DNS | Everyone ✅ |

---

**Status:** Ready to deploy  
**Next Action:** Go to Vercel and add www.redeemrocket.in domain
