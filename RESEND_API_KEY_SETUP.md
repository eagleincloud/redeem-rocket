# Resend API Key Setup

**API Key:** `re_KXQtkqkj_Psy3qxwTh8pE4GftxeQf85iZ`

## ⚠️ Important: .env is Git-Ignored

The `.env` file is NOT committed to git for security. You need to manually add the Resend API key to Vercel's environment variables.

---

## ✅ Step 1: Set in Vercel Dashboard

### **For www.redeemrocket.in (Production)**

1. Go to: https://vercel.com/dashboard
2. Select project: **app-creation-request-2**
3. Go to: **Settings → Environment Variables**
4. Add new variable:
   ```
   Name:  RESEND_API_KEY
   Value: re_KXQtkqkj_Psy3qxwTh8pE4GftxeQf85iZ
   ```
5. Select: **Production** environment
6. Click: **Save**

---

## ✅ Step 2: Set in Supabase (For Edge Functions)

If using Supabase edge functions for email, also set:

```bash
supabase secrets set RESEND_API_KEY=re_KXQtkqkj_Psy3qxwTh8pE4GftxeQf85iZ
```

---

## ✅ Step 3: Trigger Redeployment

After setting the environment variable in Vercel:

1. Go to Vercel dashboard
2. Select **app-creation-request-2** project
3. Click **Deployments**
4. Find latest deployment
5. Click **... (three dots)**
6. Select **Redeploy**

Or trigger via git:
```bash
git commit --allow-empty -m "redeploy: Enable Resend email with API key"
git push origin main
```

---

## 🧪 Test Email Sending

After redeploy (5-10 minutes):

1. Go to: https://www.redeemrocket.in/app/outreach
2. Click: **"Send Email"** button (top right)
3. Select: Template or write custom email
4. Enter: Your test email address
5. Click: **"Send Now"**
6. Check your inbox - should receive email! ✅

---

## ✅ Verification

- [ ] Added RESEND_API_KEY to Vercel dashboard
- [ ] Set Production environment
- [ ] Triggered redeploy
- [ ] Wait 5-10 minutes for deploy
- [ ] Test email sending works
- [ ] Received email in inbox ✅

---

## 📊 What This Enables

With the API key configured:

✅ **Single Email Sending** - Send individual emails via "Send Email" button  
✅ **Email Campaigns** - Send bulk emails to customers  
✅ **Email Tracking** - See open rates, click rates, delivery status  
✅ **Drafts** - Save emails as drafts and send later  
✅ **Templates** - Use pre-built templates or custom HTML  

---

## 💡 Note

The API key supports:
- **3,000 emails/month** on free tier
- **Unlimited** on paid tiers
- Full tracking and analytics
- Custom branding with your domain

---

**Status:** Ready to enable email sending!
