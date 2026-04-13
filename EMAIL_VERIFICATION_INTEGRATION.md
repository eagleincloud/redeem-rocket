# Email Verification Integration Guide

Quick integration examples for your existing auth flows.

## 1. Add to LoginPage After OTP Verification

Update `src/app/components/LoginPage.tsx` to send verification email after successful OTP verification:

```tsx
import { sendVerificationEmail } from '@/app/lib/emailVerificationService';
import { EmailVerificationFlow } from '@/app/components/EmailVerificationFlow';

// In LoginPage component
type Step = 'contact' | 'otp' | 'verify-email' | 'success';

// Update state
const [step, setStep] = useState<Step>('contact');
const [newUser, setNewUser] = useState(false);

// In handleVerifyOtp function, after successful OTP verification:
async function handleVerifyOtp() {
  if (otp.length !== 6) { setError('Enter all 6 digits'); return; }
  setError('');
  setLoading(true);
  const result = await verifyOtp(contact.trim(), contactType, otp);
  setLoading(false);

  if (!result.ok) {
    if (result.attemptsLeft !== undefined) setAttemptsLeft(result.attemptsLeft);
    setError(result.error ?? 'Verification failed');
    setOtp('');
    return;
  }

  try {
    const { user, isNew } = await getOrCreateAppUser(contact.trim(), contactType);
    setNewUser(isNew);

    // If email and new user, show email verification
    if (contactType === 'email' && isNew) {
      setStep('verify-email');
      return;
    }

    // For phone or returning email users, skip to success
    const builtUser = buildLocalStorageUser(user);
    localStorage.setItem('user', JSON.stringify(builtUser));
    setStep('success');
    setTimeout(() => {
      if (isNew && !localStorage.getItem('geo:onboarding_done')) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }, 1400);
  } catch {
    setError('Login failed. Please try again.');
  }
}

// Add render section for verify-email step
{step === 'verify-email' && (
  <motion.div key="verify-email" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
    <EmailVerificationFlow
      userId={user!.id}
      email={contact}
      userType="app"
      autoStart={true}
      onVerified={() => {
        const builtUser = buildLocalStorageUser(user!);
        localStorage.setItem('user', JSON.stringify(builtUser));
        setStep('success');
        setTimeout(() => {
          if (newUser && !localStorage.getItem('geo:onboarding_done')) {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 1400);
      }}
    />
  </motion.div>
)}
```

## 2. Make Email Verification Optional

For existing users or if you want to make it optional:

```tsx
// Add toggle or allow skipping
{step === 'verify-email' && (
  <motion.div>
    <EmailVerificationFlow
      userId={user!.id}
      email={contact}
      userType="app"
      onVerified={continueToNextStep}
    />

    <button
      onClick={() => {
        // Skip email verification and continue
        continueToNextStep();
      }}
      style={{ marginTop: 16, textAlign: 'center', color: '#9ca3af' }}
    >
      Skip for now
    </button>
  </motion.div>
)}
```

## 3. Add Email Verification to Profile/Settings

Show verification status on user profile:

```tsx
import { getVerificationStatus } from '@/app/lib/emailVerificationService';
import { EmailVerificationFlow } from '@/app/components/EmailVerificationFlow';

export function ProfilePage() {
  const user = useLocalStorageUser();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await getVerificationStatus(user.id, 'app');
      setVerificationStatus(status);
    };
    checkStatus();
  }, [user.id]);

  if (!verificationStatus) return <div>Loading...</div>;

  return (
    <div>
      <h1>Profile</h1>

      {/* Email Verification Status */}
      <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16 }}>
        <h3>Email Verification</h3>

        {verificationStatus.verified ? (
          <div style={{ color: '#22c55e' }}>
            ✓ Email verified on {new Date(verificationStatus.verifiedAt!).toLocaleDateString()}
          </div>
        ) : (
          <div>
            <p>Your email is not verified yet.</p>
            {!showVerification ? (
              <button
                onClick={() => setShowVerification(true)}
                style={{
                  padding: '8px 16px',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Verify Email
              </button>
            ) : (
              <EmailVerificationFlow
                userId={user.id}
                email={verificationStatus.email!}
                userType="app"
                autoStart={true}
                onVerified={() => {
                  setShowVerification(false);
                  // Refresh verification status
                  const status = await getVerificationStatus(user.id, 'app');
                  setVerificationStatus(status);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

## 4. Require Email Verification for Certain Actions

Before sensitive operations, check if email is verified:

```tsx
import { isEmailVerified } from '@/app/lib/emailVerificationService';

async function handleSensitiveAction() {
  const verified = await isEmailVerified(user.id, 'app');

  if (!verified) {
    // Show modal or prompt to verify
    setShowVerificationRequired(true);
    return;
  }

  // Proceed with action
  proceedWithAction();
}
```

## 5. Add Banner for Unverified Emails

Show a persistent banner until email is verified:

```tsx
import { isEmailVerified } from '@/app/lib/emailVerificationService';

export function UnverifiedEmailBanner() {
  const user = useLocalStorageUser();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const check = async () => {
      const isVerified = await isEmailVerified(user.id, 'app');
      setVerified(isVerified);
    };
    check();
  }, [user.id]);

  if (verified) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        background: '#fef3c7',
        border: '1px solid #fcd34d',
        padding: '12px 16px',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <span style={{ color: '#92400e', fontSize: 13 }}>
        ⚠️ Please verify your email to unlock all features
      </span>
      <button
        onClick={() => navigate('/verify-email-setup')}
        style={{
          padding: '6px 12px',
          background: '#f59e0b',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Verify now
      </button>
    </motion.div>
  );
}

// Add to your main layout
export function App() {
  return (
    <div>
      <UnverifiedEmailBanner />
      {/* Rest of app */}
    </div>
  );
}
```

## 6. Business App Integration

For `biz_users`:

```tsx
import { sendVerificationEmail, isEmailVerified } from '@/app/lib/emailVerificationService';

// Send verification email after business signup
const { user, isNew } = await getOrCreateBizUser(email, 'email');

if (isNew) {
  // Send verification with userType='biz'
  await sendVerificationEmail(user.id, email, 'biz');
}

// Check if verified
const verified = await isEmailVerified(user.id, 'biz');
```

## 7. Admin Force Verify

For admins to mark emails as verified without token:

```tsx
import { markEmailVerified } from '@/app/lib/emailVerificationService';

async function handleAdminVerifyEmail(userId: string) {
  const result = await markEmailVerified(userId, 'app');

  if (result.ok) {
    console.log('Email marked as verified');
  } else {
    console.error(result.error);
  }
}
```

## 8. Batch Check Verification Status

Check multiple users' verification status:

```tsx
import { getVerificationStatus } from '@/app/lib/emailVerificationService';

async function checkMultipleUsers(userIds: string[]) {
  const statuses = await Promise.all(
    userIds.map(id => getVerificationStatus(id, 'app'))
  );

  const unverified = userIds.filter((id, i) => !statuses[i].verified);
  console.log('Unverified users:', unverified);

  return statuses;
}
```

## Implementation Checklist

- [ ] **Database**: Run migration to add columns
- [ ] **Secrets**: Set `RESEND_API_KEY`, `RESEND_FROM`, `VERIFICATION_URL` in Supabase
- [ ] **Route**: Add `/verify-email` route to your router
- [ ] **Edge Function**: Deploy `send-verification-email`
- [ ] **LoginPage**: Add `verify-email` step after OTP verification
- [ ] **Optional**: Add banner for unverified emails
- [ ] **Optional**: Add to profile/settings page
- [ ] **Optional**: Require verification for certain features
- [ ] **Test**: Send verification email and click link
- [ ] **Test**: Resend email (check countdown timer works)
- [ ] **Production**: Set production Resend domain

## Email Verification Popup Modal

If you want a modal instead of full page:

```tsx
import { useState } from 'react';
import { Dialog, DialogContent } from '@/app/components/ui/dialog';
import { EmailVerificationFlow } from '@/app/components/EmailVerificationFlow';

export function VerificationModal({ userId, email, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: 450 }}>
        <EmailVerificationFlow
          userId={userId}
          email={email}
          userType="app"
          autoStart={true}
          onVerified={() => {
            onClose();
            // Refresh user data or show success message
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
```

## Testing Commands

```bash
# Test edge function locally
supabase functions serve send-verification-email

# Check edge function logs
supabase functions logs send-verification-email

# List all secrets
supabase secrets list

# Set a secret
supabase secrets set RESEND_API_KEY "re_xxx"

# Verify token in database
supabase sql -f - << EOF
SELECT * FROM email_verification_tokens
WHERE email = 'test@example.com'
ORDER BY created_at DESC LIMIT 1;
EOF
```

## Support

For detailed information about each function, see the docstrings in:
- `src/app/lib/emailVerificationService.ts`
- `supabase/functions/send-verification-email/index.ts`
