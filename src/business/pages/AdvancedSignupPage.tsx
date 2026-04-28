/**
 * Advanced Signup Page
 * Email/OAuth signup with auto-filled use case
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Building2, ArrowRight, Loader } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import type { UseCase } from '../types/advanced-onboarding';

export function AdvancedSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const useCase = (searchParams.get('useCase') || 'none') as UseCase;

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const accent = '#f97316';
  const text = '#e2e8f0';
  const textMuted = '#64748b';
  const cardBg = '#0e1530';
  const inputBg = '#0a0e27';
  const borderColor = 'rgba(255,140,80,0.2)';
  const errorColor = '#ef4444';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Sign up with Supabase
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            business_name: formData.businessName,
            use_case: useCase,
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create business user record
        const { error: insertError } = await supabase
          .from('biz_users')
          .insert({
            id: data.user.id,
            email: formData.email,
            name: formData.name,
            business_name: formData.businessName,
            use_case: useCase,
            onboarding_status: 'pending',
            feature_preferences: {
              product_catalog: true,
              lead_management: false,
              email_campaigns: false,
              automation: false,
              social_media: false,
            },
          });

        if (insertError && insertError.code !== '23505') {
          // 23505 is duplicate key error, user might exist
          setError(insertError.message);
          setLoading(false);
          return;
        }

        // Redirect to onboarding
        navigate('/business/onboarding?step=welcome');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/business/onboarding?step=welcome`,
        },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#080d20',
      color: text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Left Panel - Info */}
      <div style={{
        flex: 1,
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d0621 0%, #1a0a4d 100%)',
      }}>
        <h1 style={{ fontSize: 44, fontWeight: 900, marginBottom: 24, lineHeight: 1.2 }}>
          Join thousands of <span style={{ color: accent }}>successful businesses</span>
        </h1>
        <p style={{ fontSize: 18, color: textMuted, lineHeight: 1.6, marginBottom: 48 }}>
          Set up your business system in 10 minutes. Everything you need to manage orders, leads, and growth—in one place.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { icon: '⚡', text: 'AI-powered setup in 10 minutes' },
            { icon: '📊', text: 'Real-time analytics and insights' },
            { icon: '🤖', text: 'Automated workflows and campaigns' },
            { icon: '👥', text: 'Team collaboration tools included' },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <span style={{ fontSize: 16 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{
        flex: 1,
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Create your account</h2>
            <p style={{ color: textMuted }}>
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: accent,
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                Log in
              </button>
            </p>
          </div>

          {/* Use Case Display */}
          {useCase !== 'none' && (
            <div style={{
              padding: 16,
              background: 'rgba(255,140,80,0.1)',
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              marginBottom: 24,
              fontSize: 14,
              color: textMuted,
            }}>
              We've customized this setup for <strong>{useCase === 'restaurant' ? 'restaurants' : useCase === 'services' ? 'service businesses' : 'online stores'}</strong>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name Input */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                Your Name
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <User size={18} style={{ position: 'absolute', left: 12, color: textMuted }} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 8,
                    color: text,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(249,115,22,0.1)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = borderColor;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Business Name Input */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                Business Name
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Building2 size={18} style={{ position: 'absolute', left: 12, color: textMuted }} />
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="My Restaurant"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 8,
                    color: text,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(249,115,22,0.1)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = borderColor;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                Email Address
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Mail size={18} style={{ position: 'absolute', left: 12, color: textMuted }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 8,
                    color: text,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(249,115,22,0.1)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = borderColor;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                Password
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, color: textMuted }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 40px',
                    background: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 8,
                    color: text,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(249,115,22,0.1)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = borderColor;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    background: 'none',
                    border: 'none',
                    color: textMuted,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                Confirm Password
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, color: textMuted }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 8,
                    color: text,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(249,115,22,0.1)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = borderColor;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: 12,
                background: 'rgba(239,68,68,0.1)',
                border: `1px solid ${errorColor}`,
                borderRadius: 8,
                color: errorColor,
                fontSize: 14,
              }}>
                {error}
              </div>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 16px',
                background: accent,
                color: '#000',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              {loading ? (
                <>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0', opacity: 0.5 }}>
            <div style={{ flex: 1, height: 1, background: borderColor }} />
            <span style={{ fontSize: 12, color: textMuted }}>or</span>
            <div style={{ flex: 1, height: 1, background: borderColor }} />
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              color: text,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            Continue with Google
          </button>

          {/* Terms */}
          <p style={{ fontSize: 12, color: textMuted, textAlign: 'center', marginTop: 24 }}>
            By signing up, you agree to our{' '}
            <button
              onClick={() => {}}
              style={{
                background: 'none',
                border: 'none',
                color: accent,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              onClick={() => {}}
              style={{
                background: 'none',
                border: 'none',
                color: accent,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
