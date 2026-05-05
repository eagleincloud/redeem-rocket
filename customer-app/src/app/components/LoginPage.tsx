import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { login } from '../utils/auth';
import { hasCompletedSetup } from '../utils/appState';
import { Rocket, Mail, Lock, Eye, EyeOff, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    // Simulate slight delay for UX
    await new Promise(r => setTimeout(r, 400));
    const result = login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'Login failed.');
      return;
    }
    // Redirect based on onboarding status
    if (hasCompletedSetup()) {
      navigate('/dashboard');
    } else {
      navigate('/details');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '-10%', right: '-10%', width: 480, height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: '-10%', left: '-10%', width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative">
        {/* Logo */}
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

        {/* Card */}
        <div
          className="rounded-3xl p-8 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

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
                  onChange={e => setEmail(e.target.value)}
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
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-white gap-2 rounded-xl mt-2"
              style={{
                background: loading ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>
                  Sign In
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

          {/* Register link */}
          <div className="text-center">
            <p className="text-white/50 text-sm mb-3">Don't have an account yet?</p>
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all"
              style={{ fontWeight: 600, fontSize: '0.9rem' }}
            >
              <Sparkles className="w-4 h-4" />
              Create a New Account
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-5">
          <Link to="/" className="text-white/30 text-xs hover:text-white/60 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
