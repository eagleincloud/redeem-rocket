# OTP Password Reset Flow - Setup Guide

This guide explains the complete OTP password reset flow implementation for your Vite + React + Supabase project.

## 📋 Overview

The password reset flow consists of:
1. **Request Reset** - User enters email, receives OTP via email
2. **Verify OTP** - User enters 6-digit code from email
3. **Reset Password** - User sets new password
4. **Success** - Password is updated in database

## 🏗️ Architecture

### Database Layer
- **Migration**: `20240019_password_reset_flow.sql`
  - Adds `password_hash`, `password_set_at`, `auth_method` columns to `biz_users` and `app_users`
  - Creates `password_reset_tokens` table for tracking reset requests
  - 10-minute OTP expiration, 3 attempt limit

### Backend (Edge Functions)
- **Function**: `password-reset-otp` (Supabase Edge Function)
  - **Action: request** - Generates OTP, stores hash, sends email via Resend
  - **Action: verify** - Validates OTP against stored hash
  - **Action: reset** - Updates password after OTP verification

### Frontend
- **Page**: `src/business/pages/ForgotPasswordPage.tsx`
  - 4-step wizard: Request → Verify → Reset → Success
  - Real-time password strength indicator
  - Error handling with attempt tracking

- **Route**: `/forgot-password` (added to business app routes)

### Authentication Service
- **File**: `src/app/lib/authService.ts`
- **Functions**:
  - `requestPasswordReset(email, userTable)` - Request OTP
  - `verifyPasswordResetOtp(email, otp, userTable)` - Verify OTP
  - `resetPasswordWithOtp(email, otp, newPassword, userTable)` - Complete reset

## 🚀 Deployment Steps

### 1. Apply Database Migration

```bash
# Run the migration in Supabase SQL Editor
# Navigate to: https://supabase.com/dashboard/project/[your-project-id]/sql/new
# Copy contents from: supabase/migrations/20240019_password_reset_flow.sql
# Execute the SQL
```

### 2. Deploy Edge Function

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Deploy the function
cd supabase/functions/password-reset-otp
supabase functions deploy password-reset-otp

# Or from project root:
supabase functions deploy password-reset-otp --project-id [your-project-id]
```

### 3. Configure Email Provider (Resend)

```bash
# Set up Resend secrets in Supabase
supabase secrets set --project-id [your-project-id] RESEND_API_KEY "[your-api-key]"
supabase secrets set --project-id [your-project-id] RESEND_FROM "Redeem Rocket <password-reset@yourdomain.com>"

# For testing, use:
# supabase secrets set --project-id [your-project-id] RESEND_FROM "Redeem Rocket <onboarding@resend.dev>"
```

### 4. Test in Development

```bash
# Without RESEND_API_KEY configured, OTPs print to edge function logs
# Check Supabase Edge Functions logs in the dashboard
# Format: [DEV] Password reset OTP for [email]: [otp]
```

## 🔑 Environment Variables (Optional)

In `.env` or your deployment config:
```env
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```

These are already configured if you have the business app running.

## 📱 Usage

### For Business Users

1. **Go to Login**: Navigate to `/login`
2. **Click "Forgot password?"** link below password field
3. **Enter Email**: Email registered with your account
4. **Check Email**: Copy 6-digit code from reset email
5. **Enter Code**: Paste code on the verification screen
6. **Set New Password**: Enter new password meeting requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
7. **Confirm**: Password is updated, redirect to login

### For App Users

The same flow can be used for `app_users` by passing `'app_users'` to the functions:

```typescript
await requestPasswordReset(email, 'app_users');
```

You can create a similar `ForgotPasswordPage` component in the app if needed.

## 🔒 Security Features

- **OTP Hashing**: 6-digit OTP is SHA-256 hashed before storage
- **Expiration**: OTPs expire after 10 minutes
- **Attempt Limiting**: Maximum 3 failed verification attempts
- **One-Time Use**: OTP is marked as verified/used
- **Password Hashing**: Passwords are bcryptjs hashed (10 salt rounds)
- **User Validation**: Doesn't reveal if email exists (prevents user enumeration)

## 🧪 Testing Locally

### Without Resend API Key

1. Deploy the function locally or to Supabase
2. Monitor Edge Function logs in Supabase dashboard
3. Logs show: `[DEV] Password reset OTP for [email]: [otp]`
4. Use this OTP in the form

### With Resend Sandbox

1. Configure `RESEND_FROM` with `onboarding@resend.dev`
2. Test emails go to configured address
3. Use for demo purposes (doesn't send to actual users)

### Production Setup

1. Configure real Resend API key
2. Set `RESEND_FROM` to verified sender domain
3. Emails are sent to actual user addresses

## 📧 Email Template

The password reset email includes:
- 🔐 Reset password icon
- 6-digit OTP code (large, monospace, highlighted)
- 10-minute expiration notice
- Security warnings
- Professional Redeem Rocket branding

## 🐛 Troubleshooting

### Edge Function Not Found (404)

```
Error: Could not reach verification service
```

**Solution**: Ensure `password-reset-otp` function is deployed:
```bash
supabase functions deploy password-reset-otp --project-id [your-project-id]
```

### Email Not Sending

```
Error: Email delivery failed (500)
```

**Solutions**:
1. Check RESEND_API_KEY is set correctly
2. Verify RESEND_FROM is a verified sender
3. Check edge function logs for Resend API errors
4. Without API key, OTPs print to console logs

### OTP Not Found Error

```
Error: No reset request found
```

**Reasons**:
1. User already verified the OTP
2. OTP expired (10 minutes)
3. User requested reset from different email

**Solution**: Request new reset by clicking "Forgot password?" again

### Too Many Attempts Error

```
Error: Too many failed attempts
```

**Reason**: Maximum 3 failed verification attempts

**Solution**: Request new reset to get new OTP

## 🔄 API Reference

### Edge Function: `password-reset-otp`

#### Request Reset
```typescript
const response = await supabase.functions.invoke('password-reset-otp', {
  body: {
    action: 'request',
    email: 'user@example.com',
    userTable: 'biz_users' // or 'app_users'
  }
});

// Response: { ok: true }
```

#### Verify OTP
```typescript
const response = await supabase.functions.invoke('password-reset-otp', {
  body: {
    action: 'verify',
    email: 'user@example.com',
    otp: '123456',
    userTable: 'biz_users'
  }
});

// Response: { ok: true } or { ok: false, error: '...', attemptsLeft: 2 }
```

#### Reset Password
```typescript
const response = await supabase.functions.invoke('password-reset-otp', {
  body: {
    action: 'reset',
    email: 'user@example.com',
    otp: '123456',
    newPassword: '[bcrypt-hashed-password]', // Pre-hashed by client
    userTable: 'biz_users'
  }
});

// Response: { ok: true, message: 'Password reset successfully.' }
```

### Auth Service Functions

```typescript
// Request OTP
const result = await requestPasswordReset(email, 'biz_users');
// { ok: true } | { ok: false, error: string }

// Verify OTP
const result = await verifyPasswordResetOtp(email, otp, 'biz_users');
// { ok: true } | { ok: false, error: string, attemptsLeft?: number }

// Reset Password
const result = await resetPasswordWithOtp(email, otp, password, 'biz_users');
// { ok: true } | { ok: false, error: string }
```

## 📝 Database Schema

### password_reset_tokens Table
```sql
id              -- UUID primary key
user_id         -- UUID (user being reset)
user_table      -- 'biz_users' or 'app_users'
email           -- Email address
contact_type    -- 'email' or 'phone'
otp_hash        -- SHA-256 hash of 6-digit OTP
expires_at      -- Timestamp (10 minutes from creation)
attempts        -- Failed attempt count (max 3)
verified_at     -- Timestamp when OTP was verified
completed_at    -- Timestamp when password was reset
created_at      -- Creation timestamp
```

### Updated Users Tables
```sql
-- Added to biz_users and app_users:
password_hash     -- bcryptjs hash (10 rounds)
password_set_at   -- Last password change timestamp
auth_method       -- 'otp' | 'password' | 'google'
```

## 🎯 Future Enhancements

1. **SMS OTP**: Add MSG91 support for phone-based resets
2. **Email Resend**: Add "Resend code" button after 30 seconds
3. **Rate Limiting**: Limit reset requests per email (e.g., 5 per hour)
4. **Account Recovery**: Add security questions or backup codes
5. **Session Invalidation**: Invalidate all active sessions on password reset
6. **Audit Logging**: Track password reset attempts and completions
7. **Two-Factor Authentication**: Optional 2FA after password reset

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Supabase edge function logs
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly

## ✅ Checklist

- [ ] Migration deployed to Supabase
- [ ] Edge function deployed (`password-reset-otp`)
- [ ] Resend API key configured (or testing with dev mode)
- [ ] Routes updated (forgot-password route exists)
- [ ] ForgotPasswordPage component imported
- [ ] Link added to LoginPage
- [ ] Tested password reset flow end-to-end
- [ ] Verified OTP emails are sent correctly
- [ ] Confirmed password changes work in database
