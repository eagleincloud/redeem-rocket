import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { verifyEmailToken } from '@/app/lib/emailVerificationService';

export function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    verifyEmail();
  }, [token]);

  async function verifyEmail() {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check your email link.');
      return;
    }

    try {
      const result = await verifyEmailToken(token);

      if (result.ok) {
        setStatus('success');
        setMessage('Email verified successfully!');

        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else {
        setStatus('error');
        setMessage(result.error ?? 'Failed to verify email. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again later.');
      console.error('[EmailVerificationPage] Verification error:', err);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #1e0050 0%, #4f046e 40%, #7c1a7a 70%, #9d174d 100%)',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: '40px 32px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          textAlign: 'center',
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
            background: 'linear-gradient(90deg, #7c3aed, #db2777, #f97316)',
            borderRadius: '20px 20px 0 0',
          }}
        />

        {status === 'loading' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block', marginBottom: 24 }}
          >
            <Loader size={48} color="#7c3aed" strokeWidth={2} />
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            style={{ marginBottom: 24 }}
          >
            <CheckCircle size={56} color="#22c55e" strokeWidth={1.5} />
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ scale: 0, rotate: 20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            style={{ marginBottom: 24 }}
          >
            <XCircle size={56} color="#ef4444" strokeWidth={1.5} />
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#111827',
            marginBottom: 12,
            margin: '0 0 12px',
          }}
        >
          {status === 'loading' && 'Verifying email...'}
          {status === 'success' && 'Email verified!'}
          {status === 'error' && 'Verification failed'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            fontSize: 14,
            color:
              status === 'error'
                ? '#6b7280'
                : status === 'success'
                  ? '#059669'
                  : '#6b7280',
            margin: '0 0 24px',
            lineHeight: 1.6,
          }}
        >
          {message}
        </motion.p>

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', gap: 12, flexDirection: 'column' }}
          >
            <button
              onClick={() => navigate('/login', { replace: true })}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Return to login
            </button>
            <button
              onClick={() => navigate('/', { replace: true })}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: '1.5px solid #e5e7eb',
                background: '#fff',
                color: '#374151',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Go to home
            </button>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: 12,
              color: '#9ca3af',
              marginTop: 16,
            }}
          >
            Redirecting you to the app...
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
