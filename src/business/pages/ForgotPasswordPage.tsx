import { useState } from 'react';
import { useNavigate, Link }  from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertCircle, Check } from 'lucide-react';
import { validatePassword, resetPasswordAfterOtp } from '@/app/lib/authService';
import { supabase } from '@/app/lib/supabase';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.includes('@')) {
        setError('Invalid email');
        setLoading(false);
        return;
      }

      if (!supabase) {
        setError('Database error');
        setLoading(false);
        return;
      }

      const { data: user } = await supabase
        .from('biz_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (!user) {
        setError('Email not found');
        setLoading(false);
        return;
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const key = `reset_${email.toLowerCase()}`;
      sessionStorage.setItem(key, JSON.stringify({
        code,
        expires: Date.now() + 600000,
      }));

      console.log(`📧 OTP: ${code}`);
      setSuccess(`Code sent! Check console (F12).`);
      setTimeout(() => {
        setSuccess('');
        setStep('otp');
      }, 1500);
    } catch (err) {
      setError('Error: ' + String(err).slice(0, 50));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const key = `reset_${email.toLowerCase()}`;
      const stored = sessionStorage.getItem(key);

      if (!stored) {
        setError('Code expired');
        return;
      }

      const { code: savedCode, expires } = JSON.parse(stored);

      if (Date.now() > expires) {
        sessionStorage.removeItem(key);
        setError('Code expired');
        return;
      }

      if (otp !== savedCode) {
        setError('Wrong code');
        return;
      }

      sessionStorage.removeItem(key);
      setSuccess('Verified!');
      setTimeout(() => {
        setSuccess('');
        setStep('password');
      }, 1000);
    } catch (err) {
      setError('Error');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const validation = validatePassword(password);
      if (!validation.valid) {
        setError(validation.errors[0]);
        setLoading(false);
        return;
      }

      const result = await resetPasswordAfterOtp(email, password);

      if (!result.ok) {
        setError(result.error || 'Failed');
        setLoading(false);
        return;
      }

      setSuccess('Password reset!');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError('Error: ' + String(err).slice(0, 50));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            {step === 'email' && 'Enter your email'}
            {step === 'otp' && 'Enter code from console'}
            {step === 'password' && 'Set new password'}
            {step === 'success' && 'Done!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded p-3 flex gap-2">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Code'}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <Input
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
              <Button type="submit" className="w-full">
                Verify Code
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <Check className="w-12 h-12 text-green-600 mx-auto" />
              <p>Password reset successful!</p>
              <Link to="/login" className="text-blue-600 hover:underline">
                Back to login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
