import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertCircle, Loader2, Check } from 'lucide-react';
import {
  validatePassword,
  resetPasswordAfterOtp,
} from '@/app/lib/authService';
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
  const [attemptsLeft, setAttemptsLeft] = useState(3);

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

  // ── STEP 1: Request Password Reset ─────────────────────────────────────────
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

      // Check if user exists
      if (!supabase) {
        setError('Supabase not configured');
        setLoading(false);
        return;
      }

      const { data: user } = await supabase
        .from('biz_users')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (!user) {
        setError('Email not found. Please sign up first.');
        setLoading(false);
        return;
      }

      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in sessionStorage (10 minutes expiry)
      sessionStorage.setItem(`pwd_reset_otp_${email.toLowerCase()}`, JSON.stringify({
        code: generatedOtp,
        expires: Date.now() + 10 * 60 * 1000,
      }));

      // Log OTP to console for testing
      console.log(`📧 Password Reset OTP for ${email}: ${generatedOtp}`);

      setSuccessMessage('Reset code generated! Check console (F12) for OTP code.');
      setTimeout(() => {
        setSuccessMessage('');
        setCurrentStep('verify');
      }, 2000);
    } catch (err) {
      console.error('Password reset request error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP ────────────────────────────────────────────────────
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

      // Retrieve stored OTP from sessionStorage
      const storedData = sessionStorage.getItem(`pwd_reset_otp_${email.toLowerCase()}`);

      if (!storedData) {
        setError('OTP request expired. Please request a new one.');
        setLoading(false);
        return;
      }

      const { code, expires } = JSON.parse(storedData);

      // Check if OTP has expired
      if (Date.now() > expires) {
        sessionStorage.removeItem(`pwd_reset_otp_${email.toLowerCase()}`);
        setError('OTP has expired. Please request a new one.');
        setLoading(false);
        return;
      }

      // Verify OTP matches
      if (otp.trim() !== code) {
        setError('Invalid OTP. Please check and try again.');
        setLoading(false);
        return;
      }

      // OTP verified - clear it and move to reset
      sessionStorage.removeItem(`pwd_reset_otp_${email.toLowerCase()}`);

      setSuccessMessage('OTP verified successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        setCurrentStep('reset');
      }, 1500);
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: Reset Password ─────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate passwords
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

      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        setError(validation.errors[0]);
        setLoading(false);
        return;
      }

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
      console.error('Password reset error:', err);
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
                {currentStep === 'verify' && 'Enter the code from your email'}
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
              <div>
                <p className="text-sm text-red-800">{error}</p>
                {attemptsLeft > 0 && attemptsLeft < 3 && currentStep === 'verify' && (
                  <p className="text-xs text-red-600 mt-1">
                    Attempts remaining: {attemptsLeft}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: Request Reset */}
          {currentStep === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="text-purple-600 hover:underline font-medium">
                  Login here
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {currentStep === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter Code</label>
                <p className="text-xs text-gray-600">
                  We sent a 6-digit code to <span className="font-medium">{email}</span>
                </p>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  disabled={loading}
                  className="text-center text-lg tracking-widest font-mono"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className={`h-1 flex-1 rounded ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className={`h-1 flex-1 rounded ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  {passwordErrors.length > 0 && (
                    <ul className="text-xs text-red-600 space-y-1">
                      {passwordErrors.map((err) => (
                        <li key={err}>• {err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading || passwordErrors.length > 0 || !newPassword || !confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Password Reset Successful</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your password has been changed. You can now login with your new password.
                </p>
              </div>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
