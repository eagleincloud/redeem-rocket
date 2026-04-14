import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertCircle, Loader2, Check } from 'lucide-react';
import { validatePassword, resetPasswordAfterOtp } from '@/app/lib/authService';
import { supabase } from '@/app/lib/supabase';

type ResetStep = 'request' | 'verify' | 'reset' | 'success';

interface ForgotPasswordPageProps {
  onSuccess?: () => void;
}

export function ForgotPasswordPage({ onSuccess }: ForgotPasswordPageProps) {
  const navigate = useNavigate();

  // Form state
  const [currentStep, setCurrentStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password validation state
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Handle password validation display
  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    if (value) {
      const validation = validatePassword(value);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  // ── STEP 1: Request Password Reset (Generate OTP locally) ─────────────────────
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Verify user exists
      if (!supabase) {
        setError('Supabase not configured');
        setLoading(false);
        return;
      }

      const { data: user, error: userError } = await supabase
        .from('biz_users')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (userError || !user) {
        setError('Email not found. Please sign up first.');
        setLoading(false);
        return;
      }

      // Generate 6-digit OTP locally
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in sessionStorage (10 min expiry)
      sessionStorage.setItem(`pwd_reset_otp_${email.toLowerCase()}`, JSON.stringify({
        code: newOtp,
        expires: Date.now() + 10 * 60 * 1000,
      }));

      // Log to console for testing
      console.log(`📧 Password Reset OTP for ${email}: ${newOtp}`);

      setSuccessMessage('Reset code generated! Check console (F12) for code.');
      setTimeout(() => {
        setSuccessMessage('');
        setCurrentStep('verify');
      }, 2000);
    } catch (err) {
      console.error('Error generating OTP:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP (from sessionStorage) ──────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otp || otp.length !== 6) {
        setError('Please enter a valid 6-digit code');
        setLoading(false);
        return;
      }

      // Get OTP from sessionStorage
      const storedOtpData = sessionStorage.getItem(`pwd_reset_otp_${email.toLowerCase()}`);

      if (!storedOtpData) {
        setError('OTP request expired or not found. Please request a new one.');
        setLoading(false);
        return;
      }

      const { code: storedCode, expires: expiresAt } = JSON.parse(storedOtpData);

      // Check expiry
      if (Date.now() > expiresAt) {
        sessionStorage.removeItem(`pwd_reset_otp_${email.toLowerCase()}`);
        setError('OTP has expired. Please request a new one.');
        setLoading(false);
        return;
      }

      // Verify code matches
      if (otp.trim() !== storedCode) {
        setError('Invalid code. Please check and try again.');
        setLoading(false);
        return;
      }

      // Clear OTP after verification
      sessionStorage.removeItem(`pwd_reset_otp_${email.toLowerCase()}`);

      setSuccessMessage('Code verified! Now set your new password.');
      setTimeout(() => {
        setSuccessMessage('');
        setCurrentStep('reset');
      }, 1500);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: Reset Password (update in database) ───────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate both passwords entered
      if (!newPassword || !confirmPassword) {
        setError('Please enter both passwords');
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Validate password strength
      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        setError(validation.errors[0]);
        setLoading(false);
        return;
      }

      // Update password in database
      const result = await resetPasswordAfterOtp(email, newPassword);

      if (!result.ok) {
        setError(result.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccessMessage('Password reset successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        setCurrentStep('success');
      }, 1500);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep === 'verify') {
      setOtp('');
      setCurrentStep('request');
      setError('');
    } else if (currentStep === 'reset') {
      setNewPassword('');
      setConfirmPassword('');
      setCurrentStep('verify');
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription className="text-base">
                {currentStep === 'request' && 'Enter your email to receive a reset code'}
                {currentStep === 'verify' && 'Enter the code from console (F12)'}
                {currentStep === 'reset' && 'Create a new password'}
                {currentStep === 'success' && 'Password reset complete'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* STEP 1: Request Reset */}
          {currentStep === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="aditya@eagleincloud.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </Button>
              <div className="text-center text-sm">
                <Link to="/login" className="text-blue-600 hover:underline">
                  Back to login
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {currentStep === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reset Code (6 digits)</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  disabled={loading}
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Check console (F12 → Console tab) for code like "📧 Password Reset OTP for..."
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {currentStep === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={loading}
                  required
                />
                {passwordErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordErrors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600">• {err}</p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Min 8 chars, uppercase, lowercase, number, special char
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
            </form>
          )}

          {/* STEP 4: Success */}
          {currentStep === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Password Reset Complete!</h3>
              <p className="text-sm text-gray-600">
                You can now login with your new password.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
