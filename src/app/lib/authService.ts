/**
 * authService.ts
 * OTP-based authentication for both the customer app and business app.
 *
 * ── Phone flow ────────────────────────────────────────────────────────────────
 *  1. sendOtp(phone, 'phone')        → MSG91 edge function sends 6-digit SMS OTP
 *  2. verifyOtp(phone, 'phone', code) → MSG91 verifies code
 *
 * ── Email flow (Firebase Firestore OTP) ──────────────────────────────────────
 *  1. sendOtp(email, 'email')          → generates 6-digit OTP, stores SHA-256 hash in
 *                                        Firebase Firestore `email_otps/{emailHash}`,
 *                                        delivers code via Supabase `email-otp` edge fn
 *  2. verifyOtp(email, 'email', code)  → hashes entered code, compares with Firestore,
 *                                        deletes document on success (one-time use)
 *
 * ── After verification ────────────────────────────────────────────────────────
 *  3. getOrCreateAppUser / getOrCreateBizUser  → upserts user row in DB
 *  4. buildLocalStorageUser / buildLocalStorageBizUser → shapes for localStorage
 *
 * ── Env vars needed ───────────────────────────────────────────────────────────
 *   VITE_SUPABASE_URL                  — Supabase project URL
 *   VITE_SUPABASE_ANON_KEY             — Supabase anonymous key
 *   VITE_MSG91_API_KEY                 — MSG91 auth key (phone OTP)
 *   VITE_MSG91_OTP_TEMPLATE_ID         — OTP SMS template ID from MSG91
 *   VITE_FIREBASE_*   — Firebase config (Auth + Firestore for email OTP + FCM)
 */

import { supabase } from './supabase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, Timestamp,
} from 'firebase/firestore';
import { firebaseAuth, firebaseDb } from './firebase';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/passwordUtils';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContactType = 'phone' | 'email';

export interface OtpSendResult {
  ok: boolean;
  error?: string;
}

export interface OtpVerifyResult {
  ok: boolean;
  error?: string;
  attemptsLeft?: number;
}

export interface AppUserRow {
  id: string;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  last_login?: string | null;
}

export interface BizUserRow {
  id: string;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  business_id?: string | null;
  created_at: string;
  last_login?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BusinessRow { [key: string]: any; }

// ── Crypto helpers (used only for dev-mode email OTP) ─────────────────────────

/** Generate a cryptographically random 6-digit OTP string */
export function generateOtp(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String((arr[0] % 900_000) + 100_000);
}

// ── MSG91 phone OTP (send / verify / resend) ──────────────────────────────────

const MSG91_KEY = () => import.meta.env.VITE_MSG91_API_KEY as string | undefined;

async function sendPhoneOtpMsg91(phone: string): Promise<OtpSendResult> {
  const key = MSG91_KEY();
  if (!key) {
    const devOtp = generateOtp();
    console.info(`[DEV] Phone OTP for +91${phone}: ${devOtp}  (set VITE_MSG91_API_KEY to send real SMS)`);
    sessionStorage.setItem(`dev_otp_phone_${phone}`, devOtp);
    return { ok: true };
  }
  if (!supabase) return { ok: false, error: 'Supabase not configured.' };
  try {
    const { data, error } = await supabase.functions.invoke('msg91-otp', {
      body: { action: 'send', mobile: `91${phone}` },
    });
    if (error) return { ok: false, error: 'Could not reach SMS service. Check your connection.' };
    if (data?.type === 'success') return { ok: true };
    return { ok: false, error: data?.message ?? 'SMS delivery failed. Please try again.' };
  } catch {
    return { ok: false, error: 'Could not reach SMS service. Check your connection.' };
  }
}

async function verifyPhoneOtpMsg91(phone: string, otp: string): Promise<OtpVerifyResult> {
  const key = MSG91_KEY();
  if (!key) {
    const stored = sessionStorage.getItem(`dev_otp_phone_${phone}`);
    if (!stored) return { ok: false, error: 'No OTP found. Please request a new one.' };
    if (stored !== otp.trim()) return { ok: false, error: 'Incorrect OTP.', attemptsLeft: 2 };
    sessionStorage.removeItem(`dev_otp_phone_${phone}`);
    return { ok: true };
  }
  if (!supabase) return { ok: false, error: 'Supabase not configured.' };
  try {
    const { data, error } = await supabase.functions.invoke('msg91-otp', {
      body: { action: 'verify', mobile: `91${phone}`, otp: otp.trim() },
    });
    if (error) return { ok: false, error: 'Could not reach verification service.' };
    if (data?.type === 'success') return { ok: true };
    return { ok: false, error: data?.message ?? 'Incorrect OTP. Please try again.' };
  } catch {
    return { ok: false, error: 'Could not reach verification service.' };
  }
}

export async function resendPhoneOtp(phone: string): Promise<OtpSendResult> {
  const key = MSG91_KEY();
  if (!key) return sendPhoneOtpMsg91(phone);
  if (!supabase) return { ok: false, error: 'Supabase not configured.' };
  try {
    const { data, error } = await supabase.functions.invoke('msg91-otp', {
      body: { action: 'retry', mobile: `91${phone}` },
    });
    if (error) return { ok: false, error: 'Could not reach SMS service.' };
    if (data?.type === 'success') return { ok: true };
    return { ok: false, error: data?.message ?? 'Failed to resend OTP.' };
  } catch {
    return { ok: false, error: 'Could not reach SMS service.' };
  }
}

// ── Email OTP via Firebase Firestore ──────────────────────────────────────────
//
// Flow:
//   1. generateOtp()  — 6-digit code generated locally
//   2. SHA-256 hash   — stored in Firestore `email_otps/{emailHash}`
//   3. Email delivery — calls Supabase edge `email-otp` with action:'send_email'
//                       (edge fn just sends the email, no Supabase storage)
//   4. Verify         — client re-hashes entered code, compares with Firestore
//   5. On match       — Firestore doc deleted; no magic link ever sent
//
// Firestore security rules needed (Firebase Console → Firestore → Rules):
//
//   match /email_otps/{docId} {
//     allow create: if request.resource.data.attempts == 0;
//     allow read:   if true;
//     allow update: if resource.data.attempts < 3;
//     allow delete: if true;
//   }

const OTP_TTL_MS  = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

/** SHA-256 hex of a string via Web Crypto */
async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendEmailOtp(email: string): Promise<OtpSendResult> {
  // ── Dev / no-Firebase fallback ──────────────────────────────────────────────
  if (!firebaseDb) {
    const devOtp = generateOtp();
    console.info(`[DEV] Email OTP for ${email}: ${devOtp}  (Firebase not configured — set VITE_FIREBASE_* in .env)`);
    sessionStorage.setItem(`dev_otp_email_${email}`, devOtp);
    return { ok: true };
  }

  try {
    const otp     = generateOtp();
    const otpHash = await sha256hex(otp);
    const docId   = await sha256hex(email.toLowerCase()); // privacy: no raw email as doc ID
    const ref     = doc(firebaseDb, 'email_otps', docId);

    // Overwrite any previous unverified OTP for this email
    await setDoc(ref, {
      otp_hash:   otpHash,
      expires_at: Timestamp.fromDate(new Date(Date.now() + OTP_TTL_MS)),
      attempts:   0,
      created_at: Timestamp.now(),
    });

    // Deliver the OTP via Supabase edge function (email send only — no Supabase storage)
    if (supabase) {
      const { data, error } = await supabase.functions.invoke('email-otp', {
        body: { action: 'send_email', email, otp },
      });
      if (error || data?.ok === false) {
        return { ok: false, error: 'Could not send OTP email. Please try again.' };
      }
    } else {
      // No Supabase — log to console for local testing
      console.info(`[DEV] OTP email would be sent to ${email}. Code: ${otp}`);
    }

    return { ok: true };
  } catch (err) {
    console.error('[Firebase] sendEmailOtp error:', err);
    return { ok: false, error: 'Could not reach email service. Check your connection.' };
  }
}

async function verifyEmailOtp(email: string, code: string): Promise<OtpVerifyResult> {
  // ── Dev / no-Firebase fallback ──────────────────────────────────────────────
  if (!firebaseDb) {
    const stored = sessionStorage.getItem(`dev_otp_email_${email}`);
    if (!stored) return { ok: false, error: 'No OTP found. Please request a new one.' };
    if (stored !== code.trim()) return { ok: false, error: 'Incorrect OTP.', attemptsLeft: 2 };
    sessionStorage.removeItem(`dev_otp_email_${email}`);
    return { ok: true };
  }

  try {
    const docId = await sha256hex(email.toLowerCase());
    const ref   = doc(firebaseDb, 'email_otps', docId);
    const snap  = await getDoc(ref);

    if (!snap.exists()) {
      return { ok: false, error: 'No OTP found. Please request a new one.' };
    }

    const data = snap.data();

    // Expiry check
    if ((data.expires_at as Timestamp).toDate() < new Date()) {
      await deleteDoc(ref);
      return { ok: false, error: 'OTP has expired. Please request a new one.' };
    }

    // Attempts guard
    const attempts = (data.attempts as number ?? 0) + 1;
    if (attempts > MAX_ATTEMPTS) {
      return { ok: false, error: 'Too many failed attempts. Please request a new OTP.', attemptsLeft: 0 };
    }

    // Hash comparison
    const enteredHash = await sha256hex(code.trim());
    if (enteredHash !== (data.otp_hash as string)) {
      await updateDoc(ref, { attempts });
      const left = Math.max(0, MAX_ATTEMPTS - attempts);
      return { ok: false, error: 'Incorrect OTP. Please try again.', attemptsLeft: left };
    }

    // ✅ Correct — delete the document so OTP cannot be reused
    await deleteDoc(ref);
    return { ok: true };
  } catch (err) {
    console.error('[Firebase] verifyEmailOtp error:', err);
    return { ok: false, error: 'Could not reach verification service.' };
  }
}

// ── Public sendOtp / verifyOtp ────────────────────────────────────────────────

export async function sendOtp(
  contact: string,
  type: ContactType,
): Promise<OtpSendResult> {
  if (type === 'phone') return sendPhoneOtpMsg91(contact);
  return sendEmailOtp(contact);
}

export async function verifyOtp(
  contact: string,
  type: ContactType,
  code: string,
): Promise<OtpVerifyResult> {
  if (type === 'phone') return verifyPhoneOtpMsg91(contact, code);
  return verifyEmailOtp(contact, code);
}

// ── Get or create app_users ───────────────────────────────────────────────────

export async function getOrCreateAppUser(
  contact: string,
  type: ContactType,
): Promise<{ user: AppUserRow; isNew: boolean }> {
  if (!supabase) {
    const mockId = btoa(contact).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    return {
      user: {
        id: `local-${mockId}`,
        [type]: contact,
        name: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
      } as AppUserRow,
      isNew: false,
    };
  }

  const field = type === 'phone' ? 'phone' : 'email';

  const { data: existing } = await supabase
    .from('app_users')
    .select('*')
    .eq(field, contact)
    .limit(1)
    .single();

  if (existing) {
    await supabase
      .from('app_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', existing.id);
    return { user: existing as AppUserRow, isNew: false };
  }

  const { data: created, error } = await supabase
    .from('app_users')
    .insert({ [field]: contact, last_login: new Date().toISOString() })
    .select('*')
    .single();

  if (error || !created) throw new Error(`Failed to create user: ${error?.message}`);
  return { user: created as AppUserRow, isNew: true };
}

// ── Get or create biz_users ───────────────────────────────────────────────────

export async function getOrCreateBizUser(
  contact: string,
  type: ContactType,
): Promise<{ user: BizUserRow; isNew: boolean; biz: BusinessRow | null }> {
  if (!supabase) {
    const mockId = btoa(contact).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    return {
      user: {
        id: `local-biz-${mockId}`,
        [type]: contact,
        name: null,
        business_id: null,
        created_at: new Date().toISOString(),
      } as BizUserRow,
      isNew: false,
      biz: null,
    };
  }

  const field = type === 'phone' ? 'phone' : 'email';

  const { data: existing } = await supabase
    .from('biz_users')
    .select('*')
    .eq(field, contact)
    .limit(1)
    .single();

  if (existing) {
    await supabase
      .from('biz_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', existing.id);

    let biz: BusinessRow | null = null;
    if (existing.business_id) {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', existing.business_id)
        .single();
      biz = data ?? null;
    }
    return { user: existing as BizUserRow, isNew: false, biz };
  }

  const { data: created, error } = await supabase
    .from('biz_users')
    .insert({ [field]: contact, last_login: new Date().toISOString() })
    .select('*')
    .single();

  if (error || !created) throw new Error(`Failed to create biz user: ${error?.message}`);
  return { user: created as BizUserRow, isNew: true, biz: null };
}

// ── Build localStorage shapes ─────────────────────────────────────────────────

export function buildLocalStorageUser(row: AppUserRow) {
  const displayName = row.name ?? row.phone ?? row.email ?? 'User';
  return {
    id: row.id,
    name: displayName,
    email: row.email ?? '',
    phone: row.phone ?? '',
    role: 'customer' as const,
    avatar:
      row.avatar_url ??
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
  };
}

export function buildLocalStorageBizUser(
  row: BizUserRow,
  biz?: BusinessRow | null,
) {
  return {
    id: row.id,
    name: row.name ?? row.email ?? row.phone ?? 'Business Owner',
    email: row.email ?? '',
    phone: row.phone ?? '',
    businessId: biz?.id ?? row.business_id ?? null,
    businessName: biz?.name ?? null,
    businessLogo: biz?.logo ?? '🏪',
    businessCategory: biz?.category ?? '',
    role: 'business' as const,
    plan: 'free' as const,
    planExpiry: null,
    onboarding_done: Boolean(biz?.id ?? row.business_id),
    isApproved: biz?.is_approved ?? false,
  };
}

// ── Google Sign-In (Firebase) ─────────────────────────────────────────────────

export const hasGoogleAuth = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

export interface GoogleSignInResult {
  ok: boolean;
  email?: string;
  name?: string;
  avatar?: string;
  error?: string;
}

/**
 * Opens a Google sign-in popup using Firebase Auth.
 * Returns the user's verified email on success.
 *
 * Setup (one-time):
 *   Firebase Console → Authentication → Sign-in methods → Google → Enable
 *   Firebase Console → Authentication → Settings → Authorized domains → add localhost, your domain
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!firebaseAuth) {
    return { ok: false, error: 'Google sign-in is not available. Configure Firebase in .env.' };
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const cred = await signInWithPopup(firebaseAuth, provider);
    const { email, displayName, photoURL } = cred.user;
    if (!email) return { ok: false, error: 'Could not get email from your Google account.' };
    return { ok: true, email, name: displayName ?? undefined, avatar: photoURL ?? undefined };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request')
      return { ok: false, error: 'CANCELLED' };
    if (code === 'auth/popup-blocked')
      return { ok: false, error: 'Popup was blocked. Please allow popups for this site and try again.' };
    if (code === 'auth/operation-not-allowed')
      return { ok: false, error: 'Google sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in methods → Google → Enable.' };
    console.error('[Firebase] Google sign-in error:', err);
    return { ok: false, error: 'Google sign-in failed. Please try again.' };
  }
}

// ── Password-based authentication ─────────────────────────────────────────────

export interface PasswordAuthResult {
  ok: boolean;
  error?: string;
  user?: BizUserRow;
  biz?: BusinessRow | null;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Register a business user with email and password
 * @param email - Business email
 * @param name - Business owner name
 * @param password - Password to set
 * @param businessName - Name of the business
 * @returns Registration result with user info
 */
export async function registerBusinessWithPassword(
  email: string,
  name: string,
  password: string,
  businessName: string,
): Promise<PasswordAuthResult> {
  // Validate password strength
  const validation = validatePasswordStrength(password);
  if (!validation.valid) {
    return { ok: false, error: validation.errors[0] };
  }

  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    // Hash the password
    const passwordHash = await hashPassword(password);

    // Check if user already exists
    const { data: existing } = await supabase
      .from('biz_users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .single();

    if (existing) {
      return { ok: false, error: 'Email already registered. Please log in instead.' };
    }

    // Create the user
    const { data: newUser, error: userError } = await supabase
      .from('biz_users')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        auth_method: 'password',
        last_login: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (userError || !newUser) {
      return { ok: false, error: `Registration failed: ${userError?.message ?? 'Unknown error'}` };
    }

    // Create business record if businessName provided
    let biz: BusinessRow | null = null;
    if (businessName && newUser.id) {
      const { data: newBiz } = await supabase
        .from('businesses')
        .insert({
          name: businessName,
          owner_id: newUser.id,
        })
        .select('*')
        .single();

      if (newBiz) {
        // Update user with business_id
        await supabase
          .from('biz_users')
          .update({ business_id: newBiz.id })
          .eq('id', newUser.id);
        biz = newBiz;
      }
    }

    return {
      ok: true,
      user: newUser as BizUserRow,
      biz,
    };
  } catch (err) {
    console.error('Registration error:', err);
    return { ok: false, error: 'Registration failed. Please try again.' };
  }
}

/**
 * Login a business user with email and password
 * @param email - Business email
 * @param password - Password to verify
 * @returns Login result with user info
 */
export async function loginBusinessWithPassword(
  email: string,
  password: string,
): Promise<PasswordAuthResult> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    // Get user by email
    const { data: user } = await supabase
      .from('biz_users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .single();

    if (!user) {
      return { ok: false, error: 'Email not found. Please check or sign up.' };
    }

    // Check if user has a password set
    if (!user.password_hash) {
      return { ok: false, error: 'No password set. Please use OTP or Google Sign-in instead.' };
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { ok: false, error: 'Incorrect password. Please try again.' };
    }

    // Update last login
    await supabase
      .from('biz_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Get business info if exists
    let biz: BusinessRow | null = null;
    if (user.business_id) {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', user.business_id)
        .single();
      biz = data ?? null;
    }

    return {
      ok: true,
      user: user as BizUserRow,
      biz,
    };
  } catch (err) {
    console.error('Login error:', err);
    return { ok: false, error: 'Login failed. Please try again.' };
  }
}

/**
 * Set or update password for a business user (e.g., after OTP signup)
 * @param userId - User ID
 * @param password - New password
 * @returns Update result
 */
export async function setBusinessPassword(
  userId: string,
  password: string,
): Promise<PasswordAuthResult> {
  const validation = validatePasswordStrength(password);
  if (!validation.valid) {
    return { ok: false, error: validation.errors[0] };
  }

  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('biz_users')
      .update({
        password_hash: passwordHash,
        password_set_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error || !data) {
      return { ok: false, error: 'Failed to set password' };
    }

    return { ok: true, user: data as BizUserRow };
  } catch (err) {
    console.error('Set password error:', err);
    return { ok: false, error: 'Failed to set password' };
  }
}

/**
 * Validate password strength for client-side feedback
 * @param password - Password to validate
 * @returns Validation result with errors
 */
export function validatePassword(password: string): PasswordValidationResult {
  return validatePasswordStrength(password);
}

// ── PASSWORD RESET FLOW (OTP-based) ──────────────────────────────────────────

export interface PasswordResetResult {
  ok: boolean;
  error?: string;
  attemptsLeft?: number;
}

/**
 * Request password reset for a user
 * Generates OTP, stores it in password_reset_tokens table, sends email
 * @param email - Email address to reset password for
 * @param userTable - 'biz_users' or 'app_users'
 * @returns Reset request result
 */
export async function requestPasswordReset(
  email: string,
  userTable: 'biz_users' | 'app_users' = 'biz_users',
): Promise<PasswordResetResult> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('password-reset-otp', {
      body: { action: 'request', email, userTable },
    });

    if (error) {
      console.error('Password reset request error:', error);
      return { ok: false, error: 'Could not send reset email. Check your connection.' };
    }

    if (!data?.ok) {
      return { ok: false, error: data?.error ?? 'Failed to send reset email.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('Password reset request error:', err);
    return { ok: false, error: 'Could not send reset email. Check your connection.' };
  }
}

/**
 * Verify OTP for password reset
 * @param email - Email address requesting reset
 * @param otp - OTP code from email
 * @param userTable - 'biz_users' or 'app_users'
 * @returns Verification result
 */
export async function verifyPasswordResetOtp(
  email: string,
  otp: string,
  userTable: 'biz_users' | 'app_users' = 'biz_users',
): Promise<PasswordResetResult> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  if (!otp || typeof otp !== 'string') {
    return { ok: false, error: 'OTP is required' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('password-reset-otp', {
      body: { action: 'verify', email, otp: otp.trim(), userTable },
    });

    if (error) {
      console.error('OTP verification error:', error);
      return { ok: false, error: 'Could not verify OTP. Check your connection.' };
    }

    if (!data?.ok) {
      return {
        ok: false,
        error: data?.error ?? 'OTP verification failed.',
        attemptsLeft: data?.attemptsLeft,
      };
    }

    return { ok: true };
  } catch (err) {
    console.error('OTP verification error:', err);
    return { ok: false, error: 'Could not verify OTP. Check your connection.' };
  }
}

/**
 * Reset password using verified OTP and new password
 * @param email - Email address
 * @param otp - Verified OTP (must be verified first)
 * @param newPassword - New password (will be hashed client-side)
 * @param userTable - 'biz_users' or 'app_users'
 * @returns Reset result
 */
export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  newPassword: string,
  userTable: 'biz_users' | 'app_users' = 'biz_users',
): Promise<PasswordResetResult> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  // Validate password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return { ok: false, error: validation.errors[0] };
  }

  try {
    // Hash password on client side
    const passwordHash = await hashPassword(newPassword);

    const { data, error } = await supabase.functions.invoke('password-reset-otp', {
      body: { action: 'reset', email, otp, newPassword: passwordHash, userTable },
    });

    if (error) {
      console.error('Password reset error:', error);
      return { ok: false, error: 'Could not reset password. Check your connection.' };
    }

    if (!data?.ok) {
      return { ok: false, error: data?.error ?? 'Failed to reset password.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('Password reset error:', err);
    return { ok: false, error: 'Could not reset password. Check your connection.' };
  }
}
