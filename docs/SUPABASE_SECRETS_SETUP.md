# Setting Supabase Secrets via Dashboard

Guide for setting API keys and secrets in Supabase without using the CLI.

---

## Why Set Secrets in Supabase?

Edge functions need access to API keys but shouldn't store them in code or .env files. Supabase secrets provide secure, encrypted storage for sensitive values.

**Current Secrets Needed:**
- `RESEND_API_KEY` — For email sending via Resend API
- `RESEND_WEBHOOK_SECRET` — For webhook signature verification (optional, for webhook security)

---

## Step 1: Access Supabase Dashboard

1. Go to **https://app.supabase.com**
2. Login with your credentials
3. Select your project: **redeemrocket** (or your project name)

---

## Step 2: Navigate to Secrets

1. In the left sidebar, click **Settings**
2. Click **Secrets and Environment Variables**
3. You'll see two tabs:
   - **Secrets** — Private (for edge functions only)
   - **Environment Variables** — Public (visible to frontend)

---

## Step 3: Add RESEND_API_KEY Secret

### Method 1: Simple Form (Recommended)

1. Click **+ Add Secret** button
2. **Name:** `RESEND_API_KEY`
3. **Value:** `re_KXQtkqkj_Psy3qxwTh8pE4GftxeQf85iZ`
4. Click **Add Secret**

### Method 2: Bulk Import (If Multiple Secrets)

1. Click **+ Add Secret** → Choose **Bulk Import**
2. Paste in format:
```
RESEND_API_KEY=re_KXQtkqkj_Psy3qxwTh8pE4GftxeQf85iZ
RESEND_WEBHOOK_SECRET=whsec_xxx...
```
3. Click **Import**

---

## Step 4: Verify Secret is Set

1. After adding, you should see it in the list:
   ```
   RESEND_API_KEY     ••••••••••••••••     (set in edge functions)
   ```
2. The value will be masked with dots for security
3. You can click the secret to view details (edit/delete)

---

## Step 5: Deploy Edge Function

Once the secret is set, the edge function can access it:

```bash
# Deploy the edge function to use the secret
supabase functions deploy bulk-outreach-email
```

Or push via Git:
```bash
git add -A
git commit -m "Deploy with Supabase secrets configured"
git push
```

---

## Step 6: Verify Secret Access in Edge Function

The edge function reads the secret like this:

```typescript
// supabase/functions/bulk-outreach-email/index.ts

const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

// Now the secret is available
console.log('API Key loaded:', RESEND_KEY ? 'Yes' : 'No');
```

---

## Optional: Add RESEND_WEBHOOK_SECRET

If you want extra security for webhooks (signature verification):

1. Go back to **Settings** → **Secrets**
2. Click **+ Add Secret**
3. **Name:** `RESEND_WEBHOOK_SECRET`
4. **Value:** (Get from Resend Dashboard → Webhooks → Your Webhook → Copy Signing Secret)
5. Click **Add Secret**

---

## Environment Variables vs Secrets

| Feature | Secrets | Environment Variables |
|---------|---------|----------------------|
| **Visibility** | Private (edge functions only) | Public (frontend can see) |
| **Use Case** | API keys, database passwords | Public config (URLs, app names) |
| **How to Read** | `Deno.env.get('SECRET_NAME')` | `import.meta.env.VITE_VAR_NAME` |
| **Security** | ✅ High (encrypted) | ⚠️ Medium (exposed to frontend) |

---

## Current Setup Summary

### Secrets (Edge Functions Only)
✅ **RESEND_API_KEY** = Set in Supabase
- Used by: `bulk-outreach-email`, `send-campaign-email`, `send-verification-email`
- Accessed via: `Deno.env.get('RESEND_API_KEY')`

✅ **RESEND_WEBHOOK_SECRET** (Optional) = Set in Supabase
- Used by: `resend-webhook` edge function
- Accessed via: `Deno.env.get('RESEND_WEBHOOK_SECRET')`

### Environment Variables (Frontend & Vercel)
✅ **VITE_RESEND_API_KEY** = Set in Vercel
- Used by: Frontend services
- Accessed via: `import.meta.env.VITE_RESEND_API_KEY`

✅ **VITE_RESEND_FROM** = Set in Vercel
- Sender address for emails
- Default: `Redeem Rocket <noreply@redeemrocket.in>`

---

## Troubleshooting

### Secret Not Accessible in Edge Function

**Problem:** `Deno.env.get('RESEND_API_KEY')` returns undefined

**Solutions:**
1. Verify secret is in **Secrets** tab (not Environment Variables)
2. Redeploy the edge function after adding secret:
   ```bash
   supabase functions deploy bulk-outreach-email
   ```
3. Check secret name matches exactly (case-sensitive)
4. Verify you're in the correct Supabase project

### Can't See Secrets Tab

**Problem:** Settings don't show Secrets section

**Solutions:**
1. Ensure you have **Admin** role in the project
2. Try refreshing the browser
3. Check you're viewing the right project (top-left dropdown)
4. Try a different browser

### Secret Value Showing as Masked Dots

**This is normal!** Supabase masks secret values for security.

To verify it's set:
1. Try using it in an edge function (if it works, the secret is correct)
2. Or use the Supabase CLI: `supabase secrets list`

---

## Best Practices

✅ **DO:**
- Use Supabase secrets for API keys and passwords
- Rotate secrets periodically (at least monthly)
- Use unique keys for development vs production
- Document which functions use which secrets

❌ **DON'T:**
- Store secrets in `.env` or code files
- Share secret values in chat/email
- Use same secret for multiple projects
- Commit secrets to Git

---

## Alternative: Supabase CLI (If Available Later)

If you get SUPABASE_ACCESS_TOKEN in the future:

```bash
# Login to Supabase
supabase login

# Set secret via CLI
supabase secrets set RESEND_API_KEY=re_KXQtkqkj_Psy3qxwTh8pE4GftxeQf85iZ

# List secrets
supabase secrets list

# Delete secret
supabase secrets unset RESEND_API_KEY
```

---

## Security Checklist

- [ ] RESEND_API_KEY set in Supabase Secrets
- [ ] API key has appropriate permissions in Resend
- [ ] Not shared in version control (check .gitignore)
- [ ] Not hardcoded in any files
- [ ] VITE_RESEND_API_KEY set in Vercel for frontend
- [ ] Webhook signature verification enabled
- [ ] Regular audit of who has access to secrets

---

## Support

- **Supabase Docs:** https://supabase.com/docs/guides/functions/secrets
- **Resend API Keys:** https://resend.com/api-keys
