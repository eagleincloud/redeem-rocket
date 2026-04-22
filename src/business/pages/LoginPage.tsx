import { useState, useEffect } from 'react';
import { useNavigate, Link }  from 'react-router-dom';
import { loginBusinessWithPassword, sendOtp, verifyOtp, getOrCreateBizUser, signInWithGoogle } from '@/app/lib/authService';
import { logActivity } from '@/app/api/supabase-data';
import { useAuthBusiness } from '@/business/context/BusinessContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import bcrypt from 'bcryptjs';
import { PasswordResetModal } from '@/business/components/PasswordResetModal';

interface LoginFormProps {
  onSuccess?: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#162040',
  border: '1px solid rgba(255,140,80,0.15)',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#94a3b8',
  marginBottom: 6,
};

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        borderColor: focused ? '#f97316' : 'rgba(255,140,80,0.15)',
        ...props.style,
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

export function LoginPage({ onSuccess }: LoginFormProps) {
  const navigate = useNavigate();
  const { setUser, user } = useAuthBusiness();

  // If already logged in, skip the login page entirely
  useEffect(() => {
    if (user) navigate('/app', { replace: true });
  }, [user, navigate]);

  // Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // OTP login state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpType, setOtpType] = useState<'email' | 'phone'>('email');

  // Tab state
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password');

  // Password reset state
  const [showResetModal, setShowResetModal] = useState(false);

  // Handle password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginBusinessWithPassword(email, password);

      if (result.ok) {
        // Owner login succeeded
        console.log('[LoginPage] Owner login successful:', { userId: result.user?.id, email: result.user?.email, plan: (result.user as any)?.plan, businessId: result.biz?.id });
        const userData = {
          id: result.user?.id || '',
          name: result.user?.name || email,
          email: result.user?.email || '',
          phone: result.user?.phone || '',
          businessId: result.biz?.id || null,
          businessName: result.biz?.name || (result.user as any)?.business_name || null,
          businessLogo: result.biz?.logo || (result.user as any)?.business_logo || '🏪',
          businessCategory: result.biz?.category || (result.user as any)?.business_category || '',
          role: 'business' as const,
          plan: ((result.user as any)?.plan || 'free') as any,
          planExpiry: ((result.user as any)?.plan_expiry || null),
          onboarding_done: (result.user as any)?.onboarding_done ?? !!result.biz,
        };

        setUser(userData);
        localStorage.setItem('biz_user', JSON.stringify(userData));
        // Log owner login activity
        if (result.biz?.id) {
          logActivity({ businessId: result.biz.id, actorId: result.user?.id ?? '', actorType: 'owner', actorName: result.user?.name ?? email, action: 'login', metadata: { method: 'password', plan: userData.plan } });
        }
        setSuccessMessage('Login successful!');
        console.log('[LoginPage] Owner redirect to /app with navigate()');
        setTimeout(() => { onSuccess?.(); navigate('/app'); }, 1000);
        return;
      }

      // Owner login failed — try team member table
      if (!supabase) {
        setError(result.error || 'Login failed');
        return;
      }

      console.log('[LoginPage] Checking team members for email:', email.trim());
      const { data: member, error: memberErr } = await supabase
        .from('business_team_members')
        .select('id, business_id, name, email, role_id, permissions, status, password, first_login')
        .ilike('email', email.trim())
        .in('status', ['active', 'invited'])
        .single();

      if (memberErr) {
        console.log('[LoginPage] Team member query error:', memberErr.message);
        setError('Invalid email or password');
        return;
      }

      if (!member) {
        console.log('[LoginPage] No team member found for email:', email.trim());
        setError('Invalid email or password');
        return;
      }

      console.log('[LoginPage] Team member found:', { id: member.id, email: member.email, businessId: member.business_id, hasPassword: !!member.password });

      // Verify password
      const passwordMatch = member.password
        ? await bcrypt.compare(password, member.password as string)
        : false;

      if (!passwordMatch) {
        console.log('[LoginPage] Password verification failed for team member:', member.id);
        setError('Invalid email or password');
        return;
      }

      console.log('[LoginPage] Password verified successfully for team member:', member.id);

      // Mark member as active on first login
      if (member.status === 'invited') {
        console.log('[LoginPage] Marking team member as active (first login):', member.id);
        await supabase
          .from('business_team_members')
          .update({ status: 'active', joined_at: new Date().toISOString() })
          .eq('id', member.id);
      }

      // Store team member session
      const teamSession = {
        id: member.id,
        business_id: member.business_id,
        name: member.name,
        email: member.email,
        role_id: member.role_id,
        permissions: member.permissions,
        status: 'active',
      };
      console.log('[LoginPage] Saving team member session to localStorage:', { id: member.id, businessId: member.business_id });
      localStorage.setItem('team_member_session', JSON.stringify(teamSession));

      // Log team member login (fire-and-forget)
      logActivity({ businessId: member.business_id, actorId: member.id, actorType: 'team_member', actorName: member.name, action: 'login', metadata: { method: 'password', first_login: member.first_login } }).catch(() => {});

      // Flag first login for password change modal
      if (member.first_login) {
        localStorage.setItem('team_member_first_login', 'true');
        localStorage.setItem('team_member_first_login_id', member.id);
      }

      setSuccessMessage('Login successful!');

      // Hard page reload to ensure React app reinitializes with fresh localStorage data
      // This gives the browser time to flush localStorage before reload
      console.log('[LoginPage] Team member login successful, reloading page to initialize app...');
      setTimeout(() => {
        onSuccess?.();
        // Full page reload ensures BusinessContext reads fresh localStorage data
        window.location.reload();
      }, 150);
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP send
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      const contact = otpType === 'email' ? otpEmail : otpPhone;
      if (!contact) {
        setOtpError(`Please enter ${otpType === 'email' ? 'email' : 'phone'}`);
        return;
      }

      const result = await sendOtp(contact, otpType);
      if (!result.ok) {
        setOtpError(result.error || 'Failed to send OTP');
        return;
      }

      setOtpSent(true);
      setOtpError('');
    } catch (err) {
      console.error('OTP send error:', err);
      setOtpError('Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP verify
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      const contact = otpType === 'email' ? otpEmail : otpPhone;

      if (!contact || !otpCode) {
        setOtpError('Please enter OTP code');
        return;
      }

      const verifyResult = await verifyOtp(contact, otpType, otpCode);
      if (!verifyResult.ok) {
        setOtpError(verifyResult.error || 'Invalid OTP');
        return;
      }

      // Get or create user after OTP verification
      const userResult = await getOrCreateBizUser(contact, otpType);
      console.log('[LoginPage] OTP user login successful:', { userId: userResult.user?.id, email: userResult.user?.email, plan: (userResult.user as any)?.plan, businessId: userResult.biz?.id });
      const userData = {
        id: userResult.user?.id || '',
        name: userResult.user?.name || contact,
        email: userResult.user?.email || '',
        phone: userResult.user?.phone || '',
        businessId: userResult.biz?.id || null,
        businessName: userResult.biz?.name || (userResult.user as any)?.business_name || null,
        businessLogo: userResult.biz?.logo || (userResult.user as any)?.business_logo || '🏪',
        businessCategory: userResult.biz?.category || (userResult.user as any)?.business_category || '',
        role: 'business' as const,
        plan: ((userResult.user as any)?.plan || 'free') as any,
        planExpiry: ((userResult.user as any)?.plan_expiry || null),
        onboarding_done: (userResult.user as any)?.onboarding_done ?? !!userResult.biz,
      };

      setUser(userData);
      localStorage.setItem('biz_user', JSON.stringify(userData));
      setSuccessMessage('Login successful!');

      console.log('[LoginPage] OTP redirect to /app with navigate()');
      setTimeout(() => {
        onSuccess?.();
        navigate('/app');
      }, 1000);
    } catch (err) {
      console.error('OTP verify error:', err);
      setOtpError('An unexpected error occurred');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithGoogle();
      if (!result.ok) {
        if (result.error === 'CANCELLED') return;
        setError(result.error || 'Google sign-in failed');
        return;
      }

      if (!result.email) {
        setError('Could not get email from Google account');
        return;
      }

      // Get or create user after Google sign-in
      const userResult = await getOrCreateBizUser(result.email, 'email');
      console.log('[LoginPage] Google sign-in successful:', { userId: userResult.user?.id, email: userResult.user?.email, plan: (userResult.user as any)?.plan, businessId: userResult.biz?.id });
      const userData = {
        id: userResult.user?.id || '',
        name: userResult.user?.name || result.name || result.email,
        email: userResult.user?.email || result.email,
        phone: userResult.user?.phone || '',
        businessId: userResult.biz?.id || null,
        businessName: userResult.biz?.name || (userResult.user as any)?.business_name || null,
        businessLogo: userResult.biz?.logo || (userResult.user as any)?.business_logo || '🏪',
        businessCategory: userResult.biz?.category || (userResult.user as any)?.business_category || '',
        role: 'business' as const,
        plan: ((userResult.user as any)?.plan || 'free') as any,
        planExpiry: ((userResult.user as any)?.plan_expiry || null),
        onboarding_done: (userResult.user as any)?.onboarding_done ?? !!userResult.biz,
      };

      setUser(userData);
      localStorage.setItem('biz_user', JSON.stringify(userData));
      setSuccessMessage('Login successful!');

      console.log('[LoginPage] Google sign-in redirect to /app with navigate()');
      setTimeout(() => {
        onSuccess?.();
        navigate('/app');
      }, 1000);
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d0621 0%, #1a0a4d 30%, #2d1080 50%, #1a0a4d 70%, #0d0621 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Radial glow right */}
      <div
        style={{
          position: 'absolute',
          right: '-10%',
          top: '20%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <div
        style={{
          width: 420,
          maxWidth: '100%',
          background: '#0e1530',
          border: '1px solid rgba(255,140,80,0.15)',
          borderRadius: 20,
          padding: 40,
          boxShadow: '0 0 60px rgba(120,40,200,0.2)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{ height: 52, margin: '0 auto 16px', display: 'block' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <h1 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 24, margin: '0 0 6px' }}>
            Business Login
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
            Sign in to your business account
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255,140,80,0.12)',
            marginBottom: 24,
          }}
        >
          {(['password', 'otp'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '10px 0',
                fontSize: 14,
                fontWeight: 500,
                color: activeTab === tab ? '#f97316' : '#64748b',
                borderBottom: activeTab === tab ? '2px solid #f97316' : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.2s, border-color 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'password' ? 'Password' : 'OTP'}
            </button>
          ))}
        </div>

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  color: '#ef4444',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>⚠</span>
                {error}
              </div>
            )}
            {successMessage && (
              <div
                style={{
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  color: '#22c55e',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>✓</span>
                {successMessage}
              </div>
            )}

            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <DarkInput
                  type="email"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <DarkInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #f97316, #fb923c)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '14px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'opacity 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#f97316',
                    fontSize: 13,
                    fontWeight: 500,
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,140,80,0.12)' }} />
              <span style={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,140,80,0.12)' }} />
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#e2e8f0',
                border: '1px solid rgba(255,140,80,0.15)',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,140,80,0.06)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,140,80,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,140,80,0.15)';
              }}
            >
              <span style={{ fontSize: 16 }}>G</span>
              Google
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 500 }}>
                Sign up
              </Link>
            </div>
          </div>
        )}

        {/* OTP Tab */}
        {activeTab === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {otpError && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  color: '#ef4444',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>⚠</span>
                {otpError}
              </div>
            )}

            {/* OTP type toggle: Email / Phone */}
            <div style={{ display: 'flex', gap: 8 }}>
              {(['email', 'phone'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setOtpType(type);
                    setOtpSent(false);
                    setOtpCode('');
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${otpType === type ? '#f97316' : 'rgba(255,140,80,0.15)'}`,
                    background: otpType === type ? 'rgba(249,115,22,0.12)' : 'transparent',
                    color: otpType === type ? '#f97316' : '#64748b',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize',
                  }}
                >
                  <span>{type === 'email' ? '✉' : '📱'}</span>
                  {type === 'email' ? 'Email' : 'Phone'}
                </button>
              ))}
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>
                    {otpType === 'email' ? 'Email' : 'Phone Number'}
                  </label>
                  <DarkInput
                    type={otpType === 'email' ? 'email' : 'tel'}
                    placeholder={otpType === 'email' ? 'you@business.com' : '+91 9876543210'}
                    value={otpType === 'email' ? otpEmail : otpPhone}
                    onChange={(e) => {
                      if (otpType === 'email') setOtpEmail(e.target.value);
                      else setOtpPhone(e.target.value);
                    }}
                    disabled={otpLoading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  style={{
                    width: '100%',
                    background: otpLoading ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #f97316, #fb923c)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '14px',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: otpLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Sending...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Enter OTP</label>
                  <DarkInput
                    type="text"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    disabled={otpLoading}
                    maxLength={6}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    disabled={otpLoading}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      color: '#e2e8f0',
                      border: '1px solid rgba(255,140,80,0.15)',
                      borderRadius: 10,
                      padding: '13px',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: otpLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    style={{
                      flex: 1,
                      background: otpLoading ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #f97316, #fb923c)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '13px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: otpLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Verifying...
                      </>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
              </form>
            )}

            <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 500 }}>
                Sign up
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <PasswordResetModal
          onClose={() => setShowResetModal(false)}
          onSuccess={() => {
            setShowResetModal(false);
            setEmail('');
            setPassword('');
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
