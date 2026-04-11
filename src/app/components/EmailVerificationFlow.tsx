import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import {
  sendVerificationEmail,
  verifyEmailToken,
  resendVerificationEmail,
  type UserType,
} from '@/app/lib/emailVerificationService';

type Step = 'pending' | 'verifying' | 'success' | 'error';

export interface EmailVerificationFlowProps {
  userId: string;
  email: string;
  userType?: UserType;
  onVerified?: () => void;
  autoStart?: boolean;
}

export function EmailVerificationFlow({
  userId,
  email,
  userType = 'app',
  onVerified,
  autoStart = true,
}: EmailVerificationFlowProps) {
  const [step, setStep] = useState<Step>('pending');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-send verification email on mount
  useEffect(() => {
    if (autoStart) {
      handleSendEmail();
    }
  }, []);

  // Resend countdown
  useEffect(() => {
    if (countdown <= 0) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [countdown]);

  async function handleSendEmail() {
    setError('');
    setLoading(true);
    const result = await sendVerificationEmail(userId, email, userType);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? 'Failed to send verification email');
      setStep('error');
      return;
    }

    setStep('pending');
    setCountdown(60);
  }

  async function handleVerifyLink() {
    // In a real app, this would be called from the verification page with the token from URL
    // For now, we show the email-based verification
  }

  async function handleResend() {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    const result = await resendVerificationEmail(email, userType);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? 'Failed to resend verification email');
      setStep('error');
      return;
    }

    setCountdown(60);
  }

  function maskEmail() {
    const [local, domain] = email.split('@');
    return local.slice(0, 2) + '•••••@' + domain;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #7c3aed, #db2777)',
            borderRadius: '20px 20px 0 0',
          }}
        />

        <AnimatePresence mode="wait">
          {/* ── Pending: Waiting for verification ────────────────────────────── */}
          {step === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ display: 'inline-block' }}
                >
                  <Mail size={48} color="#7c3aed" strokeWidth={1.5} />
                </motion.div>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                Verify your email
              </h3>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                We've sent a verification link to
              </p>

              <div
                style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  background: '#f3f0ff',
                  borderRadius: 8,
                  border: '1px solid #e0d4ff',
                  marginBottom: 24,
                }}
              >
                <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600 }}>
                  {maskEmail()}
                </span>
              </div>

              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
                Click the link in the email to verify your account. The link expires in 24 hours.
              </p>

              {/* Check email button (for reference) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  // In a real app, this might open email client or show instructions
                  window.location.href = 'mailto:' + email;
                }}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  border: '1.5px solid #e5e7eb',
                  background: '#fff',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 12,
                  transition: 'all 0.2s',
                }}
              >
                <Mail size={16} /> Check your email
              </motion.button>

              {/* Resend button */}
              <div style={{ textAlign: 'center' }}>
                {countdown > 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                    Resend in <strong style={{ color: '#7c3aed' }}>{countdown}s</strong>
                  </p>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#7c3aed',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 8,
                      transition: 'all 0.2s',
                    }}
                  >
                    <RefreshCw size={13} /> Resend verification email
                  </motion.button>
                )}
              </div>

              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>
                Didn't receive the email? Check your spam folder or resend after {countdown > 0 ? countdown : 60}s
              </p>

              <AnimatePresence>
                {error && (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      marginTop: 16,
                      padding: '12px 14px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 10,
                      color: '#dc2626',
                      fontSize: 13,
                      textAlign: 'center',
                    }}
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Success: Email verified ───────────────────────────────────── */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center' }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
                style={{ marginBottom: 16 }}
              >
                <CheckCircle size={56} color="#22c55e" strokeWidth={1.5} />
              </motion.div>

              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                Email verified! ✓
              </h3>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
                Your email has been verified successfully.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onVerified?.()}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 20px rgba(124,58,237,0.40)',
                  transition: 'all 0.2s',
                }}
              >
                Continue <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* ── Error state ────────────────────────────────────────────────── */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                  Verification failed
                </h3>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                  {error || 'Could not send verification email'}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSendEmail}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 20px rgba(124,58,237,0.40)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>
                      ⟳
                    </span>
                    Retrying…
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} /> Try again
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  );
}
