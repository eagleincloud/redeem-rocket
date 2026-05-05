import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginBusinessWithPassword, sendOtp, verifyOtp, signInWithGoogle } from '@/app/lib/authService';
import { useAuthBusiness } from '@/business/context/BusinessContext';
import { Eye, EyeOff, Mail, Lock, Rocket, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '-10%',
          right: '-10%',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: '-10%',
          left: '-10%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
          >
            <Rocket className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-white text-center" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Welcome back
          </h1>
          <p className="text-white/60 text-sm mt-1 text-center">
            Log in to your Redeem Rocket dashboard
          </p>
        </div>

        {/* Glassmorphic Card */}
        <div
          className="rounded-3xl p-8 border border-white/10"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <form onSubmit={activeTab === 'password' ? handlePasswordLogin : (otpSent ? handleVerifyOtp : handleSendOtp)} className="space-y-5">
            {/* Error Alert */}
            {(error || otpError) && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-sm">{error || otpError}</span>
              </div>
            )}

            {/* Tab Buttons */}
            <div className="flex gap-1 bg-white/10 p-1 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('password');
                  setError('');
                  setOtpError('');
                }}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  activeTab === 'password'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('otp');
                  setError('');
                  setOtpError('');
                  setOtpSent(false);
                }}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  activeTab === 'otp'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Email OTP
              </button>
            </div>

            {/* Password Login Form */}
            {activeTab === 'password' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-white/80 text-sm" style={{ fontWeight: 500 }}>
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="pl-10 h-12 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label className="text-white/80 text-sm" style={{ fontWeight: 500 }}>
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="pl-10 pr-12 h-12 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* OTP Login Form */}
            {activeTab === 'otp' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {!otpSent ? (
                  <>
                    {/* OTP Email */}
                    <div className="space-y-2">
                      <Label className="text-white/80 text-sm" style={{ fontWeight: 500 }}>
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          disabled={otpLoading}
                          required
                          className="pl-10 h-12 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* OTP Code */}
                    <div className="space-y-2">
                      <Label className="text-white/80 text-sm" style={{ fontWeight: 500 }}>
                        Verification Code
                      </Label>
                      <Input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        disabled={otpLoading}
                        maxLength={6}
                        required
                        className="h-12 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl text-center text-lg tracking-widest"
                        autoComplete="one-time-code"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-white/50 text-xs hover:text-white/70 transition-colors"
                    >
                      ← Change email
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || otpLoading}
              className="w-full h-12 text-white gap-2 rounded-xl mt-2"
              style={{
                background: loading || otpLoading ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              {loading || otpLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {activeTab === 'otp' && !otpSent ? 'Sending OTP…' : activeTab === 'otp' && otpSent ? 'Verifying…' : 'Signing in…'}
                </span>
              ) : (
                <>
                  {activeTab === 'otp' && !otpSent ? 'Send OTP' : activeTab === 'otp' && otpSent ? 'Verify OTP' : 'Sign In'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Login */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-11 rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all bg-transparent"
            style={{ fontWeight: 600, fontSize: '0.9rem' }}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          {/* Register Link */}
          <div className="text-center mt-5">
            <p className="text-white/50 text-sm mb-3">Don't have an account yet?</p>
            <a
              href="/signup"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all"
              style={{ fontWeight: 600, fontSize: '0.9rem' }}
            >
              <Sparkles className="w-4 h-4" />
              Create a New Account
            </a>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-5">
          <a href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors">
            ← Back to Home
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
