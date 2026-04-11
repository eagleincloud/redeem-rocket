/**
 * emailVerificationService.ts
 * Email verification for app_users and biz_users
 *
 * ── Flow ──────────────────────────────────────────────────────────────────────
 *  1. sendVerificationEmail(userId, email, userType)
 *     → Generates secure token, stores in email_verification_tokens table
 *     → Calls Supabase edge function to send email with verification link
 *
 *  2. verifyEmailToken(token)
 *     → Validates token exists, not expired, not already verified
 *     → Marks token as verified
 *     → Updates user's email_verified flag in corresponding table
 *
 *  3. resendVerificationEmail(email, userType)
 *     → Invalidates old tokens for this email
 *     → Creates new token and sends email
 *
 *  4. getVerificationStatus(userId, userType)
 *     → Returns current verification status and token info
 *
 * ── Env vars needed ────────────────────────────────────────────────────────
 *   VITE_SUPABASE_URL      — Supabase project URL
 *   VITE_SUPABASE_ANON_KEY — Supabase anonymous key
 */

import { supabase } from './supabase';

export type UserType = 'app' | 'biz';

export interface VerificationSendResult {
  ok: boolean;
  error?: string;
  token?: string;
}

export interface VerificationVerifyResult {
  ok: boolean;
  error?: string;
}

export interface VerificationStatus {
  verified: boolean;
  email: string | null;
  verifiedAt: string | null;
  tokenExpires: string | null;
  canResend: boolean;
}

// ── Token generation ──────────────────────────────────────────────────────────

function generateVerificationToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Send verification email ───────────────────────────────────────────────────

export async function sendVerificationEmail(
  userId: string,
  email: string,
  userType: UserType = 'app',
): Promise<VerificationSendResult> {
  if (!supabase) {
    console.info(`[DEV] Verification email for ${email} (Supabase not configured)`);
    return { ok: true, token: 'dev-token' };
  }

  try {
    // Invalidate old unverified tokens for this email
    await supabase
      .from('email_verification_tokens')
      .update({ verified: true })
      .eq('email', email.toLowerCase())
      .eq('user_type', userType)
      .eq('verified', false);

    // Generate new token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Store token in database
    const { error: insertErr } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        user_type: userType,
        email: email.toLowerCase(),
        token,
        expires_at: expiresAt,
        verified: false,
      });

    if (insertErr) {
      console.error('[emailVerification] Token insert error:', insertErr);
      return { ok: false, error: 'Failed to create verification token.' };
    }

    // Send email via edge function
    const { data, error: invokeErr } = await supabase.functions.invoke('send-verification-email', {
      body: {
        email: email.toLowerCase(),
        token,
        userType,
      },
    });

    if (invokeErr || data?.ok === false) {
      console.error('[emailVerification] Email send error:', invokeErr || data?.error);
      return { ok: false, error: 'Failed to send verification email. Please try again.' };
    }

    return { ok: true, token };
  } catch (err) {
    console.error('[emailVerification] sendVerificationEmail error:', err);
    return { ok: false, error: 'An unexpected error occurred.' };
  }
}

// ── Verify token ──────────────────────────────────────────────────────────────

export async function verifyEmailToken(
  token: string,
): Promise<VerificationVerifyResult> {
  if (!supabase) {
    return { ok: true };
  }

  try {
    // Fetch the token record
    const { data: tokenData, error: fetchErr } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token.trim())
      .eq('verified', false)
      .single();

    if (fetchErr || !tokenData) {
      return { ok: false, error: 'Invalid or already used verification link.' };
    }

    // Check expiry
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return { ok: false, error: 'Verification link has expired. Please request a new one.' };
    }

    // Mark token as verified
    const { error: updateTokenErr } = await supabase
      .from('email_verification_tokens')
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (updateTokenErr) {
      return { ok: false, error: 'Failed to verify token.' };
    }

    // Update user's email_verified flag
    const table = tokenData.user_type === 'app' ? 'app_users' : 'biz_users';
    const { error: userUpdateErr } = await supabase
      .from(table)
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        email_verification_token: token,
      })
      .eq('id', tokenData.user_id);

    if (userUpdateErr) {
      return { ok: false, error: 'Failed to update user verification status.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[emailVerification] verifyEmailToken error:', err);
    return { ok: false, error: 'An unexpected error occurred.' };
  }
}

// ── Resend verification email ─────────────────────────────────────────────────

export async function resendVerificationEmail(
  email: string,
  userType: UserType = 'app',
): Promise<VerificationSendResult> {
  if (!supabase) {
    console.info(`[DEV] Resend verification email for ${email}`);
    return { ok: true, token: 'dev-token' };
  }

  try {
    // Find user by email
    const table = userType === 'app' ? 'app_users' : 'biz_users';
    const { data: user, error: userFetchErr } = await supabase
      .from(table)
      .select('id, email_verified')
      .eq('email', email.toLowerCase())
      .single();

    if (userFetchErr || !user) {
      return { ok: false, error: 'User not found.' };
    }

    if (user.email_verified) {
      return { ok: false, error: 'Email is already verified.' };
    }

    // Resend verification email
    return sendVerificationEmail(user.id, email, userType);
  } catch (err) {
    console.error('[emailVerification] resendVerificationEmail error:', err);
    return { ok: false, error: 'An unexpected error occurred.' };
  }
}

// ── Get verification status ───────────────────────────────────────────────────

export async function getVerificationStatus(
  userId: string,
  userType: UserType = 'app',
): Promise<VerificationStatus> {
  const defaultStatus: VerificationStatus = {
    verified: false,
    email: null,
    verifiedAt: null,
    tokenExpires: null,
    canResend: false,
  };

  if (!supabase) {
    return defaultStatus;
  }

  try {
    // Get user data
    const table = userType === 'app' ? 'app_users' : 'biz_users';
    const { data: user, error: userErr } = await supabase
      .from(table)
      .select('email, email_verified, email_verified_at')
      .eq('id', userId)
      .single();

    if (userErr || !user) {
      return defaultStatus;
    }

    // Get active token (unverified, not expired)
    const { data: token, error: tokenErr } = await supabase
      .from('email_verification_tokens')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const expiresAt = token?.expires_at ?? null;
    const canResend = !expiresAt || new Date(expiresAt) < new Date();

    return {
      verified: user.email_verified ?? false,
      email: user.email ?? null,
      verifiedAt: user.email_verified_at ?? null,
      tokenExpires: expiresAt ?? null,
      canResend,
    };
  } catch (err) {
    console.error('[emailVerification] getVerificationStatus error:', err);
    return defaultStatus;
  }
}

// ── Check if email is verified ────────────────────────────────────────────────

export async function isEmailVerified(
  userId: string,
  userType: UserType = 'app',
): Promise<boolean> {
  if (!supabase) return true; // Assume verified in dev mode

  try {
    const table = userType === 'app' ? 'app_users' : 'biz_users';
    const { data, error } = await supabase
      .from(table)
      .select('email_verified')
      .eq('id', userId)
      .single();

    if (error || !data) return false;
    return data.email_verified ?? false;
  } catch (err) {
    console.error('[emailVerification] isEmailVerified error:', err);
    return false;
  }
}

// ── Mark email as verified (for direct updates) ──────────────────────────────

export async function markEmailVerified(
  userId: string,
  userType: UserType = 'app',
): Promise<VerificationVerifyResult> {
  if (!supabase) {
    return { ok: true };
  }

  try {
    const table = userType === 'app' ? 'app_users' : 'biz_users';
    const { error } = await supabase
      .from(table)
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return { ok: false, error: 'Failed to mark email as verified.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[emailVerification] markEmailVerified error:', err);
    return { ok: false, error: 'An unexpected error occurred.' };
  }
}
