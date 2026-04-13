# Email Verification Setup Guide

This guide covers setting up email verification in your Vite + React + Supabase project with Resend as the email service.

## Architecture Overview

```
User signup
    ↓
sendVerificationEmail()
    ↓
Database: email_verification_tokens table
    ↓
Edge Function: send-verification-email (via Resend)
    ↓
User receives email with verification link
    ↓
User clicks link → verifyEmailToken(token)
    ↓
Mark user.email_verified = true
    ↓
Success
```

## Files Created

### Database
- **`supabase/migrations/20240019_email_verification.sql`**
  - Adds `email_verified`, `email_verified_at`, `email_verification_token` columns to `app_users` and `biz_users`
  - Creates `email_verification_tokens` table for tracking tokens
  - Includes indexes and RLS policies

### Services
- **`src/app/lib/emailVerificationService.ts`**
  - `sendVerificationEmail(userId, email, userType)` — Send verification email
  - `verifyEmailToken(token)` — Verify token and mark user as verified
  - `resendVerificationEmail(email, userType)` — Resend with new token
  - `getVerificationStatus(userId, userType)` — Check verification status
  - `isEmailVerified(userId, userType)` — Quick check if verified
  - `markEmailVerified(userId, userType)` — Direct marking (for admins)

### Edge Functions
- **`supabase/functions/send-verification-email/index.ts`**
  - Handles email sending via Resend
  - Accepts: `{ email, token, userType }`
  - Generates HTML email with verification link

### UI Components
- **`src/app/components/EmailVerificationFlow.tsx`**
  - Shows pending verification state
  - Displays masked email address
  - Resend button with countdown
  - Success confirmation
  - Can be embedded in your app

- **`src/app/components/EmailVerificationPage.tsx`**
  - Standalone page for email verification (accessed via link in email)
  - Handles token from URL query param: `/verify-email?token=...`
  - Shows loading/success/error states
  - Auto-redirects on success

## Setup Steps

### 1. Run Database Migration

Go to Supabase Console → SQL Editor and run:

```bash
supabase db push
```

Or manually copy-paste the SQL from `supabase/migrations/20240019_email_verification.sql` into Supabase SQL Editor.

This will create:
- New columns on `app_users` and `biz_users` tables
- `email_verification_tokens` table
- Appropriate indexes

### 2. Configure Resend (Email Service)

#### Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up (free tier: 3000 emails/month)
3. Create an API key in dashboard
4. Add to Supabase secrets

#### Set Supabase Secrets

```bash
# From terminal with supabase CLI installed:
supabase secrets set RESEND_API_KEY "your_resend_api_key_here"
supabase secrets set RESEND_FROM "Redeem Rocket <noreply@yourdomain.com>"
supabase secrets set VERIFICATION_URL "https://yourapp.com/verify-email"
```

For development/testing:
```bash
supabase secrets set RESEND_FROM "Redeem Rocket <onboarding@resend.dev>"
```

### 3. Deploy Edge Function

```bash
supabase functions deploy send-verification-email
```

To test locally:
```bash
supabase functions serve send-verification-email
```

### 4. Add Route to Your App

Update `src/app/routes.tsx`:

```tsx
import { EmailVerificationPage } from './components/EmailVerificationPage';

export const router = createBrowserRouter([
  // ... existing routes
  {
    path: '/verify-email',
    Component: EmailVerificationPage,
  },
  // ... rest of routes
]);
```

### 5. Environment Variables

Add to your `.env` file:

```env
# Supabase (already set)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# Optional: verification page URL (if different from production)
VITE_VERIFICATION_URL=http://localhost:5173/verify-email
```

Then update the edge function secrets to use this value if needed.

## Usage

### Send Verification Email After Signup

```tsx
import { sendVerificationEmail } from '@/app/lib/emailVerificationService';

// After user creates account
const result = await sendVerificationEmail(userId, userEmail, 'app');

if (result.ok) {
  // Email sent successfully
  console.log('Verification email sent');
} else {
  // Show error
  console.error(result.error);
}
```

### Show Verification Flow in Your App

```tsx
import { EmailVerificationFlow } from '@/app/components/EmailVerificationFlow';

export function OnboardingPage() {
  const user = useUser(); // your auth context

  return (
    <div>
      <h1>Complete Your Setup</h1>
      <EmailVerificationFlow
        userId={user.id}
        email={user.email}
        userType="app"
        onVerified={() => {
          // User verified email, proceed with onboarding
          navigate('/next-step');
        }}
      />
    </div>
  );
}
```

### Check if Email is Verified

```tsx
import { isEmailVerified } from '@/app/lib/emailVerificationService';

const verified = await isEmailVerified(userId, 'app');

if (!verified) {
  // Show verification prompt
}
```

### Resend Verification Email

```tsx
import { resendVerificationEmail } from '@/app/lib/emailVerificationService';

const result = await resendVerificationEmail(email, 'app');

if (result.ok) {
  // New email sent
}
```

### Get Full Verification Status

```tsx
import { getVerificationStatus } from '@/app/lib/emailVerificationService';

const status = await getVerificationStatus(userId, 'app');
console.log({
  verified: status.verified,
  email: status.email,
  verifiedAt: status.verifiedAt,
  canResend: status.canResend,
  tokenExpires: status.tokenExpires,
});
```

## Verification Flow

### For `app_users` (Customer App)

```tsx
// In LoginPage or OnboardingPage
import { getOrCreateAppUser } from '@/app/lib/authService';
import { sendVerificationEmail } from '@/app/lib/emailVerificationService';

// After OTP verification
const { user, isNew } = await getOrCreateAppUser(email, 'email');

if (isNew) {
  // New user - send verification email
  await sendVerificationEmail(user.id, email, 'app');
  // Show EmailVerificationFlow component
}
```

### For `biz_users` (Business App)

```tsx
// Similar for business app
const { user, isNew } = await getOrCreateBizUser(email, 'email');

if (isNew) {
  await sendVerificationEmail(user.id, email, 'biz');
  // Show EmailVerificationFlow component
}
```

## Testing

### Development (No Resend Key)

When `RESEND_API_KEY` is not set:
- Verification emails are logged to console
- Tokens are generated but emails aren't actually sent
- Check browser console for token

### With Resend

1. Get valid Resend API key
2. Set secrets in Supabase
3. Restart edge function
4. Send test email - you'll receive it in minutes

### Test Token Verification

```tsx
import { verifyEmailToken } from '@/app/lib/emailVerificationService';

const result = await verifyEmailToken('test-token-from-db');
console.log(result); // { ok: true } or { ok: false, error: '...' }
```

## Features

✅ **Secure tokens** — Cryptographically random 64-character tokens
✅ **Token expiry** — 24 hour default expiration
✅ **One-time use** — Tokens marked as verified after use
✅ **Resend support** — Send new tokens without creating duplicates
✅ **Rate limiting ready** — Countdown timer prevents spam
✅ **Dual user types** — Supports both `app_users` and `biz_users`
✅ **Email masking** — Shows masked email in UI (privacy)
✅ **Beautiful UI** — Smooth animations and error handling
✅ **RLS enabled** — Supabase Row-Level Security for tokens table

## Email Template

The email includes:
- Redeem Rocket branding
- Verification button with link
- 24-hour expiration notice
- Copy-paste link as fallback
- Professional HTML formatting

Customize the HTML in `supabase/functions/send-verification-email/index.ts`

## Troubleshooting

### Email not sending

1. Check `RESEND_API_KEY` is set:
   ```bash
   supabase secrets list
   ```

2. Check edge function logs:
   ```bash
   supabase functions logs send-verification-email
   ```

3. Verify email is in `RESEND_FROM` domain or use `onboarding@resend.dev` for testing

### Token verification fails

1. Check token exists in database:
   ```sql
   SELECT * FROM email_verification_tokens WHERE email = 'user@example.com';
   ```

2. Check token hasn't expired:
   ```sql
   SELECT expires_at > now() FROM email_verification_tokens WHERE token = '...';
   ```

3. Check user wasn't already verified:
   ```sql
   SELECT email_verified FROM app_users WHERE id = '...';
   ```

### Links not working

1. Verify `VERIFICATION_URL` in edge function secrets matches your app URL
2. Check route `/verify-email` is added to your app
3. Test with full URL: `https://yourapp.com/verify-email?token=xxx`

## Production Checklist

- [ ] Set `RESEND_API_KEY` in production Supabase
- [ ] Set `RESEND_FROM` with your domain (not onboarding@resend.dev)
- [ ] Set `VERIFICATION_URL` to production domain
- [ ] Deploy edge function to production
- [ ] Test email sending with real email
- [ ] Test verification link from email
- [ ] Add email verification to signup flow
- [ ] Add route `/verify-email` to your app
- [ ] Test resend functionality
- [ ] Monitor Resend dashboard for bounces/failures
- [ ] Update privacy policy mentioning email verification

## Customization

### Change Token Expiration

In `emailVerificationService.ts`, line ~68:
```tsx
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Change 24 to hours you want
```

### Change Email Template

Edit HTML in `supabase/functions/send-verification-email/index.ts` (lines 53-106)

### Change UI Colors

Edit `EmailVerificationFlow.tsx` and `EmailVerificationPage.tsx` inline styles

### Custom Email from Address

Update in Supabase secrets:
```bash
supabase secrets set RESEND_FROM "Your Company <noreply@yourdomain.com>"
```

## Next Steps

1. Run the migration
2. Set up Resend and add secrets
3. Deploy the edge function
4. Add the route to your app
5. Integrate `sendVerificationEmail()` into your signup flow
6. Test end-to-end

For questions or issues, check the service files for detailed comments.
