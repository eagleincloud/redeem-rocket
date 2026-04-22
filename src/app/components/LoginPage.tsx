import { useState, useEffect, useRef } from 'react';
import { useNavigate }  from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Mail, ArrowRight, ArrowLeft, RefreshCw, CheckCircle, Sparkles } from 'lucide-react';
import {
  sendOtp,
  verifyOtp,
  getOrCreateAppUser,
  buildLocalStorageUser,
  signInWithGoogle,
  hasGoogleAuth,
  type ContactType,
} from '@/app/lib/authService';
import { EmailVerificationFlow } from './EmailVerificationFlow';

// ── 6-digit OTP Input ─────────────────────────────────────────────────────────

function OtpBoxes({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) inputs.current[i - 1]?.focus();
    }
  }

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    if (!ch) return;
    const next = (value.slice(0, i) + ch + value.slice(i + 1)).slice(0, 6);
    onChange(next);
    if (i < 5) inputs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
      e.preventDefault();
    }
  }

  // Auto-focus first empty box when component mounts
  useEffect(() => {
    const idx = Math.min(value.length, 5);
    inputs.current[idx]?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }} onPaste={handlePaste}>
      {digits.map((d, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
        >
          <input
            ref={el => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e)}
            onKeyDown={e => handleKey(i, e)}
            onFocus={e => e.target.select()}
            style={{
              width: 46, height: 56, borderRadius: 14, textAlign: 'center',
              fontSize: 24, fontWeight: 800, fontFamily: 'monospace',
              border: `2.5px solid ${hasError ? '#ef4444' : d ? '#7c3aed' : '#e5e7eb'}`,
              outline: 'none',
              background: hasError ? '#fef2f2' : d ? '#f5f0ff' : '#f9fafb',
              color: hasError ? '#ef4444' : '#18100a',
              transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
              boxShadow: d && !hasError ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
              display: 'block',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ── Floating background blobs ─────────────────────────────────────────────────

function Blobs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'rgba(124,58,237,0.25)', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(219,39,119,0.20)', filter: 'blur(70px)' }} />
      <div style={{ position: 'absolute', top: '40%', right: '20%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(79,70,229,0.18)', filter: 'blur(60px)' }} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type Step = 'contact' | 'otp' | 'verify-email' | 'success';

export function LoginPage() {
  const navigate = useNavigate();

  const [step, setStep]                 = useState<Step>('contact');
  const [contactType, setContactType]   = useState<ContactType>('phone');
  const [contact, setContact]           = useState('');
  const [otp, setOtp]                   = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [countdown, setCountdown]       = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [newUser, setNewUser]           = useState(false);
  const [userId, setUserId]             = useState('');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('user')) navigate('/', { replace: true });
  }, [navigate]);

  // Resend countdown
  useEffect(() => {
    if (countdown <= 0) { if (countdownRef.current) clearInterval(countdownRef.current); return; }
    countdownRef.current = setInterval(() =>
      setCountdown(c => { if (c <= 1) { clearInterval(countdownRef.current!); return 0; } return c - 1; }),
      1000,
    );
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [countdown]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function validateContact(): string | null {
    const val = contact.trim();
    if (contactType === 'phone') {
      if (!/^\d{10}$/.test(val)) return 'Enter a valid 10-digit mobile number';
    } else {
      if (!val.includes('@') || !val.includes('.')) return 'Enter a valid email address';
    }
    return null;
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError('');
    const result = await signInWithGoogle();
    setLoading(false);
    if (!result.ok) {
      if (result.error !== 'CANCELLED') setError(result.error ?? 'Google sign-in failed.');
      return;
    }
    try {
      const { user, isNew } = await getOrCreateAppUser(result.email!, 'email');
      const builtUser = buildLocalStorageUser(user);
      // Save Google name/avatar if user is new or fields are empty
      if (result.name && !builtUser.name) builtUser.name = result.name;
      if (result.avatar && !builtUser.avatar) builtUser.avatar = result.avatar;
      localStorage.setItem('user', JSON.stringify(builtUser));
      setStep('success');
      setTimeout(() => {
        if (isNew && !localStorage.getItem('geo:onboarding_done')) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }, 1200);
    } catch {
      setError('Login failed. Please try again.');
    }
  }

  async function handleSendOtp() {
    const err = validateContact();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    const result = await sendOtp(contact.trim(), contactType);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? 'Failed to send OTP'); return; }

    setStep('otp');
    setOtp('');
    setAttemptsLeft(3);
    setCountdown(60);
  }

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
      setUserId(user.id);

      // If new email user, show email verification step
      if (contactType === 'email' && isNew) {
        setStep('verify-email');
        return;
      }

      // For phone users or returning email users, skip to success
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

  async function handleEmailVerified() {
    try {
      const { user } = await getOrCreateAppUser(contact.trim(), contactType);
      const builtUser = buildLocalStorageUser(user);
      localStorage.setItem('user', JSON.stringify(builtUser));
      setStep('success');
      setTimeout(() => {
        if (newUser && !localStorage.getItem('geo:onboarding_done')) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }, 1400);
    } catch {
      setError('Login failed. Please try again.');
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    const result = await sendOtp(contact.trim(), contactType);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? 'Failed to resend OTP'); return; }
    setOtp('');
    setAttemptsLeft(3);
    setCountdown(30);
  }

  // ── Masked contact display ────────────────────────────────────────────────────

  function maskContact() {
    if (contactType === 'phone') {
      return '+91 ' + contact.slice(0, 2) + '•••• ••' + contact.slice(-2);
    }
    const [local, domain] = contact.split('@');
    return local.slice(0, 2) + '•••••@' + domain;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #1e0050 0%, #4f046e 40%, #7c1a7a 70%, #9d174d 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, position: 'relative',
      }}
    >
      <Blobs />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: 28,
          padding: '36px 32px',
          width: '100%', maxWidth: 420,
          boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.15)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #7c3aed, #db2777, #f97316)',
          borderRadius: '28px 28px 0 0',
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
          >
            <img
              src="/logo.png"
              alt="Redeem Rocket"
              style={{ height: 72, width: 'auto', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Sparkles size={12} color="#f97316" />
              Discover deals · Earn cashback · Shop smart
            </p>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Contact ──────────────────────────────────────────────── */}
          {step === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                Sign in or Sign up
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 22 }}>
                We'll send a one-time code to verify your identity
              </p>

              {/* Contact type toggle */}
              <div style={{
                display: 'flex', gap: 6, marginBottom: 20,
                background: '#f3f4f6', borderRadius: 14, padding: 4,
              }}>
                {(['phone', 'email'] as ContactType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setContactType(t); setContact(''); setError(''); }}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                      background: contactType === t ? '#ffffff' : 'transparent',
                      color: contactType === t ? '#7c3aed' : '#6b7280',
                      fontWeight: contactType === t ? 700 : 500,
                      fontSize: 13.5, cursor: 'pointer',
                      boxShadow: contactType === t ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      transition: 'all 0.18s',
                    }}
                  >
                    {t === 'phone' ? <Phone size={14} /> : <Mail size={14} />}
                    {t === 'phone' ? 'Mobile' : 'Email'}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div style={{ marginBottom: 14 }}>
                {contactType === 'phone' ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{
                      padding: '12px 14px', borderRadius: 12,
                      border: '1.5px solid #e5e7eb',
                      background: '#f9fafb', color: '#374151',
                      fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={contact}
                      onChange={e => { setContact(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                      maxLength={10}
                      style={{
                        flex: 1, padding: '12px 14px', borderRadius: 12,
                        border: `1.5px solid ${error ? '#ef4444' : '#e5e7eb'}`,
                        outline: 'none', fontSize: 15, color: '#111827',
                        background: error ? '#fef2f2' : '#f9fafb',
                        transition: 'border-color 0.15s',
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={contact}
                    onChange={e => { setContact(e.target.value.toLowerCase()); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12,
                      border: `1.5px solid ${error ? '#ef4444' : '#e5e7eb'}`,
                      outline: 'none', fontSize: 15, color: '#111827',
                      background: error ? '#fef2f2' : '#f9fafb',
                      boxSizing: 'border-box', transition: 'border-color 0.15s',
                    }}
                    autoFocus
                  />
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    key="err"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ color: '#ef4444', fontSize: 13, marginBottom: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}
                  >
                    ⚠️ {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSendOtp}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.40)',
                  transition: 'all 0.2s',
                }}
              >
                {loading
                  ? <><span className="spin-icon" style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span> Sending…</>
                  : <>{contactType === 'phone' ? '📱' : '✉️'} Send OTP <ArrowRight size={16} /></>
                }
              </motion.button>

              {/* Google Sign-In */}
              {hasGoogleAuth && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>or continue with</span>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 14, border: '1.5px solid #e5e7eb',
                      background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      boxShadow: '0 1px 6px rgba(0,0,0,0.08)', transition: 'all 0.2s',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continue with Google
                  </motion.button>
                </>
              )}

              <p style={{ textAlign: 'center', fontSize: 11.5, color: '#9ca3af', marginTop: 16 }}>
                New here? An account is created automatically on first sign-in.
                <br />By continuing you agree to our Terms of Service.
              </p>
            </motion.div>
          )}

          {/* ── Step 2: OTP ──────────────────────────────────────────────────── */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <button
                onClick={() => { setStep('contact'); setError(''); setOtp(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: '#6b7280', fontSize: 13, marginBottom: 18, padding: 0,
                }}
              >
                <ArrowLeft size={15} /> Back
              </button>

              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                Enter verification code
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                We sent a 6-digit code to
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', background: '#f3f0ff', borderRadius: 8,
                marginBottom: 24, border: '1px solid #e0d4ff',
              }}>
                {contactType === 'phone' ? <Phone size={13} color="#7c3aed" /> : <Mail size={13} color="#7c3aed" />}
                <strong style={{ fontSize: 13, color: '#7c3aed', fontWeight: 700 }}>{maskContact()}</strong>
              </div>

              <OtpBoxes value={otp} onChange={v => { setOtp(v); setError(''); }} hasError={!!error} />

              <AnimatePresence>
                {error && (
                  <motion.div
                    key="otp-err"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      marginTop: 14, padding: '10px 14px', borderRadius: 10,
                      background: '#fef2f2', border: '1px solid #fecaca',
                      color: '#dc2626', fontSize: 13, textAlign: 'center',
                    }}
                  >
                    ⚠️ {error}
                    {attemptsLeft > 0 && attemptsLeft < 3 && (
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                        {' '}({attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left)
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: otp.length === 6 && !loading ? 1.02 : 1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  background: otp.length === 6 && !loading
                    ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)'
                    : '#e5e7eb',
                  color: otp.length === 6 && !loading ? '#fff' : '#9ca3af',
                  fontSize: 15, fontWeight: 700,
                  cursor: otp.length === 6 && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 20,
                  boxShadow: otp.length === 6 && !loading ? '0 4px 20px rgba(124,58,237,0.40)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {loading
                  ? <><span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span> Verifying…</>
                  : <>✓ Verify &amp; Sign In <ArrowRight size={16} /></>
                }
              </motion.button>

              {/* Resend */}
              <div style={{ textAlign: 'center', marginTop: 18 }}>
                {countdown > 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>
                    Resend OTP in <strong style={{ color: '#7c3aed' }}>{countdown}s</strong>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#7c3aed', fontSize: 13, fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 8,
                      textDecoration: 'underline', textDecorationColor: 'transparent',
                    }}
                  >
                    <RefreshCw size={13} /> Resend OTP
                  </button>
                )}
              </div>

              {/* Help text for email */}
              {contactType === 'email' && (
                <p style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
                  Check your inbox and spam folder. The code expires in 10 minutes.
                </p>
              )}
              {contactType === 'phone' && (
                <p style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
                  SMS can take up to 2 minutes to arrive.
                </p>
              )}
            </motion.div>
          )}

          {/* ── Step 3: Verify Email ──────────────────────────────────────────── */}
          {step === 'verify-email' && (
            <motion.div
              key="verify-email"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <EmailVerificationFlow
                userId={userId}
                email={contact}
                userType="app"
                autoStart={true}
                onVerified={handleEmailVerified}
              />
            </motion.div>
          )}

          {/* ── Step 4: Success ───────────────────────────────────────────────── */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ textAlign: 'center', padding: '24px 0' }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
                style={{ marginBottom: 16 }}
              >
                <CheckCircle size={72} color="#22c55e" strokeWidth={1.5} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
                  You're in! 🎉
                </h2>
                <p style={{ fontSize: 14, color: '#6b7280' }}>
                  {contactType === 'phone' ? 'Mobile' : 'Email'} verified · Redirecting…
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
