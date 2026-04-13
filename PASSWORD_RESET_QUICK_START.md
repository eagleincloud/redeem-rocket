# Password Reset Flow - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Deploy Database Migration
```bash
# Copy the SQL from supabase/migrations/20240019_password_reset_flow.sql
# Paste it in Supabase SQL Editor and execute
# URL: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql/new
```

### Step 2: Deploy Edge Function
```bash
supabase functions deploy password-reset-otp --project-id [YOUR_PROJECT_ID]
```

### Step 3: Configure Email (Optional - Resend)
```bash
# Get API key from https://resend.com
supabase secrets set --project-id [YOUR_PROJECT_ID] \
  RESEND_API_KEY "re_xxx..."

supabase secrets set --project-id [YOUR_PROJECT_ID] \
  RESEND_FROM "Redeem Rocket <password-reset@yourdomain.com>"
```

**Without API key?** OTPs print to console (perfect for testing)

### Step 4: Test the Flow
1. Go to `http://localhost:5174/login` (business app)
2. Click "Forgot password?" link
3. Enter your email
4. Check console or Supabase edge function logs for OTP
5. Enter OTP and set new password

## 💡 How It Works

```
User → Request Reset (Email) → Verify OTP (6-digit code) → New Password → ✅ Done
                ↓                        ↓                      ↓
           Send email            10 min expiry,           Bcrypt hash
                                 3 attempts
```

## 🔧 Using in Your Code

### Request Password Reset
```typescript
import { requestPasswordReset } from '@/app/lib/authService';

const result = await requestPasswordReset('user@example.com', 'biz_users');
if (result.ok) {
  console.log('OTP sent!');
} else {
  console.error(result.error);
}
```

### Verify OTP
```typescript
import { verifyPasswordResetOtp } from '@/app/lib/authService';

const result = await verifyPasswordResetOtp(
  'user@example.com',
  '123456',  // 6-digit code
  'biz_users'
);

if (result.ok) {
  console.log('OTP verified, proceed to password reset');
} else {
  console.error(`Error: ${result.error}`);
  console.log(`Attempts left: ${result.attemptsLeft}`);
}
```

### Reset Password
```typescript
import { resetPasswordWithOtp } from '@/app/lib/authService';

const result = await resetPasswordWithOtp(
  'user@example.com',
  '123456',           // verified OTP
  'NewPass123!',      // new password
  'biz_users'
);

if (result.ok) {
  // Password updated, user can login now
  window.location.href = '/login';
} else {
  console.error(result.error);
}
```

## 📧 What Users See

### Email Template
```
🔐 Reset Your Password
═══════════════════════════════════════════

Your 6-digit code:
┌──────────────┐
│   123456     │ ← Highlighted & monospace
└──────────────┘

Valid for 10 minutes · Do not share this code

Didn't request this? You can safely ignore.

Sent by Redeem Rocket
```

## 🔐 Password Requirements

Passwords must have:
- ✓ 8+ characters
- ✓ At least 1 uppercase (A-Z)
- ✓ At least 1 lowercase (a-z)
- ✓ At least 1 number (0-9)

Example: `MyPass123!` ✅

## 📱 For App Users

The same flow works for `app_users`:
```typescript
// Change 'biz_users' to 'app_users'
await requestPasswordReset(email, 'app_users');
await verifyPasswordResetOtp(email, otp, 'app_users');
await resetPasswordWithOtp(email, otp, password, 'app_users');
```

Or create a similar component in the customer app.

## 🧪 Development Testing

### Without Resend API Key
```
✓ OTPs print to Supabase edge function logs
✓ No actual emails sent
✓ Perfect for local testing
```

**To see OTPs:**
1. Open Supabase dashboard
2. Go to: Edge Functions → password-reset-otp → Logs
3. Look for: `[DEV] Password reset OTP for user@email.com: 123456`

### With Resend API Key
```
✓ Real emails sent
✓ Use for staging/production
✓ 3,000 free emails/month
```

## 🐛 Common Issues

| Error | Cause | Fix |
|-------|-------|-----|
| `Function not found (404)` | Edge function not deployed | Run `supabase functions deploy password-reset-otp` |
| `Email delivery failed` | No API key configured | Set `RESEND_API_KEY` secret |
| `Invalid OTP` | Wrong code or already verified | User needs fresh OTP |
| `Too many attempts` | 3 failed tries | User needs new OTP request |
| `OTP expired` | >10 minutes passed | User needs new OTP request |

## 📊 Database Schema

### password_reset_tokens
```
id           → UUID (primary key)
user_id      → Who is resetting password
user_table   → 'biz_users' or 'app_users'
email        → Reset request email
otp_hash     → SHA-256(123456) [not plaintext]
expires_at   → now() + 10 minutes
attempts     → Failed tries (max 3)
verified_at  → When OTP was verified
completed_at → When password was updated
created_at   → Request time
```

### Updated biz_users & app_users
```
password_hash   → bcryptjs hash (10 rounds)
password_set_at → Last password change
auth_method     → 'otp' | 'password' | 'google'
```

## 🎯 UI Walkthrough

```
┌─────────────────────────────────────────┐
│         Reset Password                  │
├─────────────────────────────────────────┤
│                                         │
│  STEP 1: Request                        │
│  ├─ Email input                         │
│  └─ Send Reset Code button              │
│                                         │
│  STEP 2: Verify                         │
│  ├─ 6-digit OTP input                   │
│  ├─ Real-time validation                │
│  └─ Verify Code button                  │
│                                         │
│  STEP 3: Reset Password                 │
│  ├─ New password input                  │
│  ├─ Strength indicator (3 bars)         │
│  ├─ Confirm password input              │
│  └─ Reset Password button               │
│                                         │
│  STEP 4: Success                        │
│  ├─ Green checkmark                     │
│  ├─ Success message                     │
│  └─ Back to Login button                │
│                                         │
└─────────────────────────────────────────┘
```

## 🔐 Security Checklist

- ✅ Passwords bcryptjs hashed (10 rounds)
- ✅ OTP SHA-256 hashed before storage
- ✅ 10-minute expiration
- ✅ 3-attempt limit
- ✅ No user enumeration (doesn't reveal if email exists)
- ✅ One-time OTP use
- ✅ Rate limiting ready (can add per email)
- ✅ HTTPS only (Resend enforces)

## 📝 Next Steps

1. ✅ Deploy migration
2. ✅ Deploy edge function
3. ✅ Configure Resend (optional)
4. ✅ Test the flow
5. ✅ Add to other parts of app if needed
6. Consider: Email verification, SMS OTP, 2FA

## 📚 Full Documentation

See `SETUP_PASSWORD_RESET.md` for:
- Detailed deployment instructions
- Email template customization
- API reference
- Troubleshooting guide
- Future enhancements

## 🎯 Files at a Glance

| File | Purpose |
|------|---------|
| `supabase/migrations/20240019_password_reset_flow.sql` | Database schema |
| `supabase/functions/password-reset-otp/index.ts` | Backend logic |
| `src/business/pages/ForgotPasswordPage.tsx` | UI component |
| `src/app/lib/authService.ts` | Frontend API (3 functions) |
| `SETUP_PASSWORD_RESET.md` | Full setup guide |
| `PASSWORD_RESET_QUICK_START.md` | This file |

---

**Ready to go!** Start with Step 1 above. Questions? Check `SETUP_PASSWORD_RESET.md`.
