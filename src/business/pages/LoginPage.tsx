import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { loginBusinessWithPassword, sendOtp, verifyOtp, getOrCreateBizUser, signInWithGoogle } from '@/app/lib/authService';
import { logActivity } from '@/app/api/supabase-data';
import { useAuthBusiness } from '@/business/context/BusinessContext';
import { AlertCircle, Loader2, Eye, EyeOff, Mail, Smartphone } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import bcrypt from 'bcryptjs';

interface LoginFormProps {
  onSuccess?: () => void;
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

  // Handle password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginBusinessWithPassword(email, password);

      if (result.ok) {
        // Owner login succeeded
        const userData = {
          id: result.user?.id || '',
          name: result.user?.name || email,
          email: result.user?.email || '',
          phone: result.user?.phone || '',
          businessId: result.biz?.id || null,
          businessName: result.biz?.name || null,
          businessLogo: result.biz?.logo || '🏪',
          businessCategory: result.biz?.category || '',
          role: 'business' as const,
          plan: 'free' as const,
          planExpiry: null,
          onboarding_done: !!result.biz,
        };

        setUser(userData);
        localStorage.setItem('biz_user', JSON.stringify(userData));
        // Log owner login activity
        if (result.biz?.id) {
          logActivity({ businessId: result.biz.id, actorId: result.user?.id ?? '', actorType: 'owner', actorName: result.user?.name ?? email, action: 'login', metadata: { method: 'password' } });
        }
        setSuccessMessage('Login successful!');
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
      const userData = {
        id: userResult.user?.id || '',
        name: userResult.user?.name || contact,
        email: userResult.user?.email || '',
        phone: userResult.user?.phone || '',
        businessId: userResult.biz?.id || null,
        businessName: userResult.biz?.name || null,
        businessLogo: userResult.biz?.logo || '🏪',
        businessCategory: userResult.biz?.category || '',
        role: 'business' as const,
        plan: 'free' as const,
        planExpiry: null,
        onboarding_done: !!userResult.biz,
      };

      setUser(userData);
      localStorage.setItem('biz_user', JSON.stringify(userData));
      setSuccessMessage('Login successful!');

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
      const userData = {
        id: userResult.user?.id || '',
        name: userResult.user?.name || result.name || result.email,
        email: userResult.user?.email || result.email,
        phone: userResult.user?.phone || '',
        businessId: userResult.biz?.id || null,
        businessName: userResult.biz?.name || null,
        businessLogo: userResult.biz?.logo || '🏪',
        businessCategory: userResult.biz?.category || '',
        role: 'business' as const,
        plan: 'free' as const,
        planExpiry: null,
        onboarding_done: !!userResult.biz,
      };

      setUser(userData);
      localStorage.setItem('biz_user', JSON.stringify(userData));
      setSuccessMessage('Login successful!');

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <div className="text-center">
            <h1 className="text-3xl font-bold">🏪</h1>
          </div>
          <CardTitle className="text-center">Business Login</CardTitle>
          <CardDescription className="text-center">
            Sign in to your business account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>

            {/* Password Login Tab */}
            <TabsContent value="password" className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>

              <div className="text-center mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                Google
              </Button>

              <div className="text-center text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 hover:underline">
                  Sign up
                </Link>
              </div>
            </TabsContent>

            {/* OTP Login Tab */}
            <TabsContent value="otp" className="space-y-4">
              {otpError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {otpError}
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setOtpType('email');
                    setOtpSent(false);
                    setOtpCode('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    otpType === 'email'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpType('phone');
                    setOtpSent(false);
                    setOtpCode('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    otpType === 'phone'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  Phone
                </button>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {otpType === 'email' ? 'Email' : 'Phone Number'}
                    </label>
                    <Input
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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={otpLoading}
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Enter OTP</label>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      disabled={otpLoading}
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setOtpSent(false)}
                      disabled={otpLoading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={otpLoading}
                    >
                      {otpLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                </form>
              )}

              <div className="text-center text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 hover:underline">
                  Sign up
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
