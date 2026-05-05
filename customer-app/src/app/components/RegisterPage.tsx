import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { register } from '../utils/auth';
import { Rocket, Mail, Lock, Eye, EyeOff, User, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains a letter', pass: /[a-zA-Z]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['#EF4444', '#F59E0B', '#10B981'];
  const labels = ['Weak', 'Fair', 'Strong'];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i < score ? colors[score - 1] : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: score > 0 ? colors[score - 1] : 'rgba(255,255,255,0.3)' }}>
        {score > 0 ? labels[score - 1] : ''}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const result = register(name, email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Registration failed.');
      return;
    }
    // New user — go through onboarding
    navigate('/details');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 flex items-center justify-center p-4 py-8">
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
            Create your account
          </h1>
          <p className="text-white/60 text-sm mt-1 text-center">
            Start building your branded business app
          </p>
        </div>

        {/* Steps hint */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {['Create Account', 'Business Details', 'Pick Features', 'Customize App'].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className="flex items-center justify-center rounded-full text-xs"
                style={{
                  width: 22, height: 22,
                  backgroundColor: i === 0 ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                  color: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                  fontWeight: 700,
                }}
              >
                {i === 0 ? '✓' : i + 1}
              </div>
              {i < 3 && <div className="w-4 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-white/80 text-sm" style={{ fontWeight: 500 }}>
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  type="text"
                  placeholder="Riya Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pl-10 h-12 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-blue-400 rounded-xl"
                  autoComplete="name"
                />
              </div>
            </div>

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
                  className="pl-10 h-12 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-blue-400 rounded-xl"
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
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-blue-400 rounded-xl"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label className="text-white/80 text-sm" style={{ fontWeight: 500 }}>
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-blue-400 rounded-xl"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400 pointer-events-none" />
                )}
              </div>
            </div>

            {/* Terms note */}
            <p className="text-white/30 text-xs pt-1">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-white gap-2 rounded-xl mt-1"
              style={{
                background: loading ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account…
                </span>
              ) : (
                <>
                  Create Account & Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">already registered?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all"
            style={{ fontWeight: 600, fontSize: '0.9rem' }}
          >
            Sign In Instead
          </Link>
        </div>

        <div className="text-center mt-5">
          <Link to="/" className="text-white/30 text-xs hover:text-white/60 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
