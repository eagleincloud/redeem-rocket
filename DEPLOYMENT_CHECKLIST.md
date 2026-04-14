# 🚀 Deployment Checklist: www.redeemrocket.in

**Status:** Ready to Deploy  
**Date:** April 14, 2026  
**Target:** www.redeemrocket.in (via Vercel)  
**Vercel Account:** aditya2tfb@gmail.com

---

## Pre-Deployment ✅

- [x] All code committed to `origin/main`
- [x] Latest features tested:
  - [x] Team member authentication
  - [x] Password reset flow with OTP
  - [x] Single email sending
  - [x] Real-time campaign tracking
  - [x] Help system & tooltips
  - [x] Mock data removed
- [x] Build passes locally: `npm run build:business`
- [x] Environment variables configured
- [x] Supabase database ready
- [x] Resend email service integrated
- [x] .env updated with production URL

---

## Deployment Steps (Follow in Order)

### Step 1: Vercel Domain Configuration ⏱️ 5 minutes

```
1. Go to: https://vercel.com/dashboard
2. Login with: aditya2tfb@gmail.com
3. Select: app-creation-request-2
4. Click: Settings → Domains
5. Click: Add Domain
6. Enter: www.redeemrocket.in
7. Click: Continue
```

**✅ Checklist:**
- [ ] Domain added to Vercel
- [ ] Vercel shows DNS configuration instructions

---

### Step 2: Configure DNS at Domain Registrar ⏱️ 5 minutes

**Choose One Method:**

#### Method A: Nameservers (Recommended)
```
1. Go to domain registrar (GoDaddy, NameCheap, etc.)
2. Find: Nameservers or DNS Settings
3. Replace with Vercel's nameservers:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
   - ns3.vercel-dns.com
   - ns4.vercel-dns.com
4. Save changes
5. Wait 24 hours for propagation
```

#### Method B: CNAME Record
```
1. Go to domain registrar
2. Find: DNS Records or CNAME
3. Add record:
   - Host/Name: www
   - Value: cname.vercel.app
   - TTL: 3600
4. Save changes
5. Wait 15-30 minutes for propagation
```

**✅ Checklist:**
- [ ] DNS method selected
- [ ] Records added at registrar
- [ ] Changes saved

---

### Step 3: Wait for DNS Propagation ⏱️ 15 min - 24 hours

**Monitor Progress:**

```bash
# Check DNS propagation
nslookup www.redeemrocket.in

# Or use online tool
https://dnschecker.org/?query=www.redeemrocket.in
```

**✅ Checklist:**
- [ ] DNS resolves to Vercel
- [ ] Vercel dashboard shows domain as "Valid"

---

### Step 4: Verify HTTPS Certificate ⏱️ Auto

Vercel automatically generates SSL/TLS certificate.

**✅ Checklist:**
- [ ] Visit: https://www.redeemrocket.in
- [ ] 🔒 Lock icon shows in browser
- [ ] No SSL warnings

---

### Step 5: Update Vercel Environment Variables ⏱️ 2 minutes

```
1. Go to: https://vercel.com/dashboard
2. Select: app-creation-request-2
3. Go to: Settings → Environment Variables
4. For Production:
   APP_BASE_URL = https://www.redeemrocket.in
   VITE_APP_URL = https://www.redeemrocket.in
5. Save changes
6. Vercel auto-redeployment starts
```

**✅ Checklist:**
- [ ] Environment variables updated
- [ ] Redeploy completed

---

### Step 6: Test Live Deployment ⏱️ 5 minutes

```
Visit: https://www.redeemrocket.in
```

**Test Checklist:**
- [ ] Page loads without errors
- [ ] Login page displays correctly
- [ ] Can login with existing account
- [ ] "Forgot Password?" link works
- [ ] Password reset OTP flow works
- [ ] Send Email button accessible
- [ ] Campaign progress tracker shows
- [ ] Help tooltips display
- [ ] No console errors (F12)

---

## Post-Deployment

### Update Documentation
- [ ] Update README with new domain
- [ ] Update invite links to use www.redeemrocket.in
- [ ] Update API documentation

### Monitoring
- [ ] Monitor Vercel deployment logs
- [ ] Check error tracking (if configured)
- [ ] Monitor uptime

### Backup Current Version
```
# Save current production URL
OLD_URL = https://app-creation-request-2.vercel.app

# If needed, can rollback to this
```

---

## Rollback Plan (If Needed)

If deployment fails:

```
1. Go to Vercel Dashboard
2. Click: Deployments
3. Find: Previous working version
4. Click: ... (three dots)
5. Select: Promote to Production
6. Confirm rollback
```

---

## Common Issues & Solutions

### Issue: Domain shows "Pending"
```
Solution: Wait 15-30 minutes, then refresh
If still pending after 1 hour, check DNS is correctly configured
```

### Issue: SSL Certificate Error
```
Solution: Usually resolves automatically in 5-15 minutes
If persists: Contact Vercel support
```

### Issue: App loads but features don't work
```
Solution: 
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+Shift+R)
3. Check environment variables in Vercel
4. Verify all Supabase secrets are set
```

### Issue: Old domain still works but new doesn't
```
Solution:
1. DNS hasn't propagated yet (wait)
2. Verify DNS configuration is correct
3. Check Vercel domain status
```

---

## Success Criteria ✅

- [x] Code deployed to Vercel
- [x] Domain www.redeemrocket.in resolves
- [x] HTTPS working (🔒 icon)
- [x] App loads without errors
- [x] All features working
- [x] Database connected
- [x] Email service working
- [x] No console errors

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Vercel domain setup | 5 min | ⏳ Pending |
| DNS configuration | 5 min | ⏳ Pending |
| DNS propagation | 15 min - 24h | ⏳ Pending |
| Vercel verification | Auto | ⏳ Pending |
| Testing | 5 min | ⏳ Pending |
| **Total** | **~30 min + DNS** | ⏳ **In Progress** |

---

## Support Contacts

- **Vercel Support:** https://vercel.com/support
- **Domain Registrar:** [Your registrar support]
- **Supabase Support:** https://supabase.com/support
- **GitHub Issues:** https://github.com/eagleincloud/redeem-rocket/issues

---

## Notes

- App previously deployed at: https://app-creation-request-2.vercel.app
- Can keep both URLs active (old still works)
- New domain takes precedence for invites/links
- Production data persists on both URLs

---

**Status:** ✅ Ready to Deploy  
**Next Action:** Start Step 1 - Configure domain in Vercel
