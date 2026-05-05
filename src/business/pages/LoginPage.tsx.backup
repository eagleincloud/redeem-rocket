import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginBusinessWithPassword, sendOtp, verifyOtp, signInWithGoogle } from '@/app/lib/authService';
import { useAuthBusiness } from '@/business/context/BusinessContext';
import { Eye, EyeOff, Mail, Lock, Rocket } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginPage({ onSuccess }: LoginFormProps) {
  const navigate = useNavigate();
  const { setUser, user } = useAuthBusiness();

  // If already logged in, skip to dashboard
  useEffect(() => {
    if (user) navigate('/app', { replace: true });
  }, [user, navigate]);

  // Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP login state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password');

  // ────────────────────────────────────────────────────────────────────────────
  // Password Login Handler
  // ────────────────────────────────────────────────────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user: authUser, bizUser } = await loginBusinessWithPassword(email, password);
      if (authUser && bizUser) {
        setUser(bizUser);
        onSuccess?.();
        navigate('/app', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // OTP Login Handlers
  // ────────────────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      await sendOtp(otpEmail);
      setOtpSent(true);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      const { user: authUser, bizUser } = await verifyOtp(otpEmail, otpCode);
      if (authUser && bizUser) {
        setUser(bizUser);
        onSuccess?.();
        navigate('/app', { replace: true });
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Google Login Handler
  // ────────────────────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      // Google redirect will handle navigation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <Card>
          {/* Header */}
          <CardHeader className="pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
                <p className="text-sm text-muted-foreground mt-1">Sign in to your Redeem Rocket account</p>
              </div>
              <div className="w-10 h-10 rounded flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                <Rocket className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-6">
              {/* Tab Buttons */}
              <div className="flex gap-1 bg-secondary p-1 rounded-md">
                <button
                  onClick={() => setActiveTab('password')}
                  className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-all ${
                    activeTab === 'password'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Email & Password
                </button>
                <button
                  onClick={() => setActiveTab('otp')}
                  className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-all ${
                    activeTab === 'otp'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Email OTP
                </button>
              </div>

              {/* Password Login */}
              {activeTab === 'password' && (
                <motion.form
                  onSubmit={handlePasswordLogin}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 text-base"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>

                  <div className="text-center pt-2">
                    <a
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                </motion.form>
              )}

              {/* OTP Login */}
              {activeTab === 'otp' && (
                <motion.form
                  onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-4"
                >
                  {!otpSent ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="otp-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="otp-email"
                            type="email"
                            placeholder="you@example.com"
                            value={otpEmail}
                            onChange={(e) => setOtpEmail(e.target.value)}
                            disabled={otpLoading}
                            required
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {otpError && (
                        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                          {otpError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-11 text-base"
                        disabled={otpLoading}
                      >
                        {otpLoading ? 'Sending OTP...' : 'Send OTP'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="otp-code">Enter OTP Code</Label>
                        <Input
                          id="otp-code"
                          type="text"
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          disabled={otpLoading}
                          maxLength={6}
                          required
                          className="text-center text-lg tracking-widest"
                        />
                      </div>

                      {otpError && (
                        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                          {otpError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-11 text-base"
                        disabled={otpLoading}
                      >
                        {otpLoading ? 'Verifying...' : 'Verify OTP'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 text-base"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpEmail('');
                          setOtpCode('');
                          setOtpError('');
                        }}
                      >
                        Back
                      </Button>
                    </>
                  )}
                </motion.form>
              )}

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google Login */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base"
                onClick={handleGoogleLogin}
                disabled={loading || otpLoading}
              >
                🔵 Sign in with Google
              </Button>

              {/* Sign Up Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <a
                    href="/register"
                    className="text-primary hover:underline font-medium"
                  >
                    Get Started
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default LoginPage;
