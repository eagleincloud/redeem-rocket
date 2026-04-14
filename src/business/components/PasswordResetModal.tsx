import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, X, Mail } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { resetPasswordAfterOtp } from '@/app/lib/authService';
import { supabase } from '@/app/lib/supabase';

interface PasswordResetModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function PasswordResetModal({ onClose, onSuccess }: PasswordResetModalProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'newpassword' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      // Check if user exists
      if (!supabase) {
        setError('Supabase not configured');
        return;
      }

      const { data: user } = await supabase
        .from('biz_users')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (!user) {
        setError('Email not found. Please sign up first.');
        return;
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP temporarily (10 minutes expiry)
      sessionStorage.setItem(`pwd_reset_otp_${email.toLowerCase()}`, JSON.stringify({
        code: otp,
        expires: Date.now() + 10 * 60 * 1000,
      }));

      // In production, send OTP via email using Resend
      console.log(`📧 Password Reset OTP for ${email}: ${otp}`);

      // Show OTP in development (you'll see it in console)
      setSuccessMessage(`OTP sent to ${email}. Check console or your email.`);
      setTimeout(() => {
        setSuccessMessage('');
        setStep('otp');
      }, 1500);
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    setLoading(true);
    try {
      // Retrieve stored OTP from sessionStorage
      const storedData = sessionStorage.getItem(`pwd_reset_otp_${email.toLowerCase()}`);

      if (!storedData) {
        setError('OTP request expired. Please request a new one.');
        return;
      }

      const { code, expires } = JSON.parse(storedData);

      // Check if OTP has expired
      if (Date.now() > expires) {
        sessionStorage.removeItem(`pwd_reset_otp_${email.toLowerCase()}`);
        setError('OTP has expired. Please request a new one.');
        return;
      }

      // Verify OTP matches
      if (otpCode.trim() !== code) {
        setError('Invalid OTP. Please check and try again.');
        return;
      }

      // OTP verified - clear it
      sessionStorage.removeItem(`pwd_reset_otp_${email.toLowerCase()}`);

      setSuccessMessage('OTP verified successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        setStep('newpassword');
      }, 1000);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Check password strength
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordAfterOtp(email.trim(), newPassword);
      if (!result.ok) {
        setError(result.error || 'Failed to reset password');
        return;
      }

      setSuccessMessage('Password reset successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        setStep('success');
      }, 1000);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          maxWidth: '450px',
          width: '90%',
          padding: '40px',
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#1e293b' }}>
            Reset Password
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* Step Progress */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['email', 'otp', 'newpassword', 'success'].map((s, i) => (
              <div
                key={s}
                style={{
                  height: '4px',
                  flex: 1,
                  background: ['email', 'otp', 'newpassword', 'success'].indexOf(step) >= i ? '#3b82f6' : '#e2e8f0',
                  borderRadius: '2px',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '6px',
              display: 'flex',
              gap: '10px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              background: '#dcfce7',
              border: '1px solid #86efac',
              color: '#166534',
              padding: '12px',
              borderRadius: '6px',
              display: 'flex',
              gap: '10px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            {successMessage}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                Email Address
              </label>
              <Input
                type="email"
                placeholder="aditya@eagleincloud.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                Enter your registered email address. We'll send an OTP to verify your identity.
              </p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>
                💡 Tip: Check the browser console (F12) for the OTP code during testing
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="default"
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Mail size={16} style={{ marginRight: '8px' }} />
                  Send OTP
                </>
              )}
            </Button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                Enter OTP Code
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                disabled={loading}
                maxLength={6}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                Check your email for a 6-digit code
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="default"
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() => setStep('email')}
              disabled={loading}
            >
              Back
            </Button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 'newpassword' && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                New Password
              </label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                Min 8 chars, uppercase, lowercase, number, and special character
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="default"
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() => setStep('otp')}
              disabled={loading}
            >
              Back
            </Button>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                background: '#dcfce7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle size={32} color='#16a34a' />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
              Password Reset Successful!
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              You can now login with your new password.
            </p>
            <Button
              onClick={() => {
                onSuccess?.();
                onClose();
              }}
              variant="default"
              style={{ width: '100%' }}
            >
              Login Now
            </Button>
          </div>
        )}

        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
