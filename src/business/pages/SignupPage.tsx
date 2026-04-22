import { useState, useRef } from 'react';
import { useNavigate, Link }  from 'react-router-dom';
import { registerBusinessWithPassword, validatePassword } from '@/app/lib/authService';
import { useAuthBusiness } from '@/business/context/BusinessContext';
import { Loader2, Eye, EyeOff, CheckCircle2, AlertTriangle, Upload, X } from 'lucide-react';

const BUSINESS_TYPES = [
  { emoji: '🍛', label: 'Restaurant' },
  { emoji: '🛒', label: 'Grocery' },
  { emoji: '💊', label: 'Pharmacy' },
  { emoji: '👗', label: 'Fashion' },
  { emoji: '🔌', label: 'Electronics' },
  { emoji: '💈', label: 'Salon' },
  { emoji: '🏋️', label: 'Fitness' },
  { emoji: '📚', label: 'Education' },
  { emoji: '🏨', label: 'Hotel' },
  { emoji: '🚗', label: 'Auto' },
  { emoji: '🎁', label: 'Gifts' },
  { emoji: '🏥', label: 'Healthcare' },
];

interface SignupFormData {
  email: string;
  ownerName: string;
  ownerPhone: string;
  ownerBio: string;
  businessName: string;
  businessCategory: string;
  businessType: string;
  businessPhone: string;
  businessEmail: string;
  businessWhatsApp: string;
  businessWebsite: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  ownerPhotoUrl?: string;
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

const errorBannerStyle: React.CSSProperties = {
  background: 'rgba(239,68,68,0.1)',
  border: '1px solid rgba(239,68,68,0.3)',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#ef4444',
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const successBannerStyle: React.CSSProperties = {
  background: 'rgba(34,197,94,0.1)',
  border: '1px solid rgba(34,197,94,0.3)',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#22c55e',
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  background: 'linear-gradient(135deg, #f97316, #fb923c)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '13px 20px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'opacity 0.2s',
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  color: '#e2e8f0',
  border: '1px solid rgba(255,140,80,0.2)',
  borderRadius: 10,
  padding: '13px 20px',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'border-color 0.2s, background 0.2s',
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

export function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthBusiness();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    ownerName: '',
    ownerPhone: '',
    ownerBio: '',
    businessName: '',
    businessCategory: '',
    businessType: '',
    businessPhone: '',
    businessEmail: '',
    businessWhatsApp: '',
    businessWebsite: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [ownerPhotoPreview, setOwnerPhotoPreview] = useState<string>('');

  // UI state
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordValidation = validatePassword(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;

  const updateForm = (updates: Partial<SignupFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setOwnerPhotoPreview(reader.result as string);
        updateForm({ ownerPhotoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setOwnerPhotoPreview('');
    updateForm({ ownerPhotoUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateStep = (stepNum: number): boolean => {
    setError('');

    if (stepNum === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all password fields');
        return false;
      }
      if (!formData.email.includes('@')) {
        setError('Please enter a valid email');
        return false;
      }
      if (!passwordValidation.valid) {
        setError(passwordValidation.errors[0] || 'Password is not strong enough');
        return false;
      }
      if (!passwordsMatch) {
        setError('Passwords do not match');
        return false;
      }
      if (!formData.agreeToTerms) {
        setError('Please agree to the terms and conditions');
        return false;
      }
      return true;
    }

    if (stepNum === 2) {
      if (!formData.ownerName) {
        setError('Please enter your full name');
        return false;
      }
      if (!formData.ownerPhone) {
        setError('Please enter your phone number');
        return false;
      }
      if (!/^\d{10}$/.test(formData.ownerPhone)) {
        setError('Please enter a valid 10-digit phone number');
        return false;
      }
      return true;
    }

    if (stepNum === 3) {
      if (!formData.businessName) {
        setError('Please enter your business name');
        return false;
      }
      if (!formData.businessCategory) {
        setError('Please select a business category');
        return false;
      }
      return true;
    }

    if (stepNum === 4) {
      if (formData.businessEmail && !formData.businessEmail.includes('@')) {
        setError('Please enter a valid business email');
        return false;
      }
      if (formData.businessWebsite && !isValidUrl(formData.businessWebsite)) {
        setError('Please enter a valid website URL');
        return false;
      }
      if (formData.businessPhone && !/^\d{10}$/.test(formData.businessPhone)) {
        setError('Please enter a valid 10-digit phone number');
        return false;
      }
      if (formData.businessWhatsApp && !/^\d{10}$/.test(formData.businessWhatsApp)) {
        setError('Please enter a valid 10-digit WhatsApp number');
        return false;
      }
      return true;
    }

    return true;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      if (step < 5) setStep(((step + 1) as unknown as number) as any);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(((step - 1) as unknown as number) as any);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(5)) return;

    setLoading(true);

    try {
      const result = await registerBusinessWithPassword(
        formData.email,
        formData.ownerName,
        formData.password,
        formData.businessName
      );

      if (!result.ok) {
        setError(result.error || 'Registration failed');
        return;
      }

      // Set user in context with all new fields
      const userData = {
        id: result.user?.id || '',
        name: result.user?.name || formData.ownerName,
        email: result.user?.email || formData.email,
        phone: formData.ownerPhone,
        businessId: result.biz?.id || null,
        businessName: result.biz?.name || formData.businessName,
        businessLogo: BUSINESS_TYPES.find((t) => t.label === formData.businessCategory)?.emoji || '🏪',
        businessCategory: formData.businessCategory,
        businessDescription: '',
        businessEmail: formData.businessEmail,
        businessPhone: formData.businessPhone,
        businessWhatsApp: formData.businessWhatsApp,
        businessWebsite: formData.businessWebsite,
        ownerPhone: formData.ownerPhone,
        ownerPhotoUrl: formData.ownerPhotoUrl,
        ownerBio: formData.ownerBio,
        role: 'business' as const,
        plan: 'free' as const,
        planExpiry: null,
        onboarding_done: false,
        acceptedPayments: [],
        documents: {},
      };

      setUser(userData);
      localStorage.setItem('biz_user', JSON.stringify(userData));
      setSuccessMessage('Account created successfully! Redirecting...');
      setStep(5);

      setTimeout(() => {
        navigate('/onboarding');
      }, 2000);
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    'Set Credentials',
    'Owner Info',
    'Business Basics',
    'Contact Details',
    'Review & Submit',
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080d20',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Cosmic gradient top section */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 300,
          background: 'linear-gradient(180deg, rgba(45,16,128,0.5) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Purple glow */}
      <div
        style={{
          position: 'fixed',
          left: '-5%',
          top: '10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,40,200,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#0e1530',
          border: '1px solid rgba(255,140,80,0.15)',
          borderRadius: 20,
          padding: 40,
          boxShadow: '0 0 60px rgba(120,40,200,0.15)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{ height: 44, margin: '0 auto 14px', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <h1 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 22, margin: '0 0 6px' }}>
            Create Business Account
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            {step === 1 && 'Step 1: Set your credentials'}
            {step === 2 && 'Step 2: Owner information'}
            {step === 3 && 'Step 3: Business basics'}
            {step === 4 && 'Step 4: Business contact details'}
            {step === 5 && 'Account created!'}
          </p>
        </div>

        {/* Progress indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          {[1, 2, 3, 4, 5].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 4 ? 1 : 'none' }}>
              {/* Dot */}
              <div
                style={{
                  width: s === step ? 32 : 24,
                  height: s === step ? 32 : 24,
                  borderRadius: '50%',
                  background: s < step
                    ? '#22c55e'
                    : s === step
                    ? 'linear-gradient(135deg, #f97316, #fb923c)'
                    : '#162040',
                  border: s > step ? '1px solid rgba(255,140,80,0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: s < step ? 12 : 11,
                  color: s <= step ? '#fff' : '#64748b',
                  fontWeight: 600,
                  flexShrink: 0,
                  transition: 'all 0.3s',
                  boxShadow: s === step ? '0 0 16px rgba(249,115,22,0.4)' : 'none',
                }}
              >
                {s < step ? '✓' : s}
              </div>
              {/* Connector line */}
              {i < 4 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: s < step
                      ? 'linear-gradient(90deg, #22c55e, rgba(34,197,94,0.3))'
                      : 'rgba(255,140,80,0.1)',
                    margin: '0 4px',
                    transition: 'background 0.3s',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step title */}
        <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18, margin: '0 0 24px' }}>
          {stepTitles[step - 1]}
        </h2>

        {/* Step 1: Credentials */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div style={errorBannerStyle}><span>⚠</span>{error}</div>}

            <div>
              <label style={labelStyle}>Email</label>
              <DarkInput
                type="email"
                placeholder="you@business.com"
                value={formData.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <DarkInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateForm({ password: e.target.value })}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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

            {formData.password && (
              <div
                style={{
                  background: 'rgba(22,32,64,0.6)',
                  border: '1px solid rgba(255,140,80,0.1)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Password Requirements
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { check: formData.password.length >= 8, label: 'At least 8 characters' },
                    { check: /[A-Z]/.test(formData.password), label: 'One uppercase letter' },
                    { check: /[a-z]/.test(formData.password), label: 'One lowercase letter' },
                    { check: /[0-9]/.test(formData.password), label: 'One number' },
                  ].map((req, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        color: req.check ? '#22c55e' : '#64748b',
                      }}
                    >
                      {req.check
                        ? <CheckCircle2 size={13} />
                        : <AlertTriangle size={13} />}
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <DarkInput
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateForm({ confirmPassword: e.target.value })}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
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
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {formData.confirmPassword && !passwordsMatch && (
              <div style={errorBannerStyle}>
                <span>⚠</span>
                Passwords do not match
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreeToTerms}
                onChange={(e) => updateForm({ agreeToTerms: e.target.checked })}
                style={{ marginTop: 2, accentColor: '#f97316', cursor: 'pointer' }}
              />
              <label htmlFor="terms" style={{ fontSize: 13, color: '#94a3b8', cursor: 'pointer', lineHeight: 1.5 }}>
                I agree to the{' '}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: '#f97316', textDecoration: 'none' }}
                >
                  Terms and Conditions
                </a>
              </label>
            </div>

            <button type="submit" style={{ ...primaryBtnStyle, flex: 'none', width: '100%', marginTop: 4 }}>
              Next: Owner Information
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 500 }}>
                Log in
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Owner Information */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div style={errorBannerStyle}><span>⚠</span>{error}</div>}

            <div>
              <label style={labelStyle}>Your Full Name</label>
              <DarkInput
                type="text"
                placeholder="John Doe"
                value={formData.ownerName}
                onChange={(e) => updateForm({ ownerName: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Phone Number</label>
              <DarkInput
                type="tel"
                placeholder="9876543210"
                value={formData.ownerPhone}
                onChange={(e) => updateForm({ ownerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                maxLength={10}
                required
              />
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>10-digit phone number</div>
            </div>

            {/* Profile Photo */}
            <div>
              <label style={labelStyle}>Profile Photo (Optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
              {ownerPhotoPreview ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    background: '#162040',
                    border: '1px solid rgba(255,140,80,0.15)',
                    borderRadius: 10,
                  }}
                >
                  <img
                    src={ownerPhotoPreview}
                    alt="Preview"
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(249,115,22,0.4)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>Photo uploaded</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Click remove to change</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 6,
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '20px',
                    border: '2px dashed rgba(249,115,22,0.25)',
                    borderRadius: 10,
                    background: 'rgba(249,115,22,0.04)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 13,
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(249,115,22,0.5)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(249,115,22,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(249,115,22,0.25)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(249,115,22,0.04)';
                  }}
                >
                  <Upload size={16} />
                  Upload photo
                </button>
              )}
            </div>

            <div>
              <label style={labelStyle}>Bio (Optional)</label>
              <textarea
                placeholder="Tell us about yourself..."
                value={formData.ownerBio}
                onChange={(e) => updateForm({ ownerBio: e.target.value })}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
                onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = '#f97316'; }}
                onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,140,80,0.15)'; }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={handlePrevStep} disabled={loading} style={secondaryBtnStyle}>
                Back
              </button>
              <button type="submit" disabled={loading} style={primaryBtnStyle}>
                Next: Business Info
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Business Basics */}
        {step === 3 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div style={errorBannerStyle}><span>⚠</span>{error}</div>}

            <div>
              <label style={labelStyle}>Business Name</label>
              <DarkInput
                type="text"
                placeholder="My Awesome Store"
                value={formData.businessName}
                onChange={(e) => updateForm({ businessName: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ ...labelStyle, marginBottom: 12 }}>Business Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {BUSINESS_TYPES.map(({ emoji, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => updateForm({ businessCategory: label })}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 10,
                      border: `2px solid ${formData.businessCategory === label ? '#f97316' : 'rgba(255,140,80,0.12)'}`,
                      background: formData.businessCategory === label
                        ? 'rgba(249,115,22,0.1)'
                        : '#162040',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      boxShadow: formData.businessCategory === label ? '0 0 12px rgba(249,115,22,0.2)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: formData.businessCategory === label ? '#f97316' : '#94a3b8' }}>
                      {label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={handlePrevStep} disabled={loading} style={secondaryBtnStyle}>
                Back
              </button>
              <button type="submit" disabled={loading} style={primaryBtnStyle}>
                Next: Contact Details
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Business Contact Details */}
        {step === 4 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div style={errorBannerStyle}><span>⚠</span>{error}</div>}

            <div>
              <label style={labelStyle}>Business Email (Optional)</label>
              <DarkInput
                type="email"
                placeholder="business@example.com"
                value={formData.businessEmail}
                onChange={(e) => updateForm({ businessEmail: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>Business Phone (Optional)</label>
              <DarkInput
                type="tel"
                placeholder="9876543210"
                value={formData.businessPhone}
                onChange={(e) => updateForm({ businessPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                maxLength={10}
              />
            </div>

            <div>
              <label style={labelStyle}>WhatsApp Number (Optional)</label>
              <DarkInput
                type="tel"
                placeholder="9876543210"
                value={formData.businessWhatsApp}
                onChange={(e) => updateForm({ businessWhatsApp: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                maxLength={10}
              />
            </div>

            <div>
              <label style={labelStyle}>Website (Optional)</label>
              <DarkInput
                type="text"
                placeholder="https://example.com"
                value={formData.businessWebsite}
                onChange={(e) => updateForm({ businessWebsite: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={handlePrevStep} disabled={loading} style={secondaryBtnStyle}>
                Back
              </button>
              <button type="submit" disabled={loading} style={primaryBtnStyle}>
                Review &amp; Submit
              </button>
            </div>
          </form>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div style={errorBannerStyle}><span>⚠</span>{error}</div>}

            {successMessage && (
              <div style={successBannerStyle}>
                <CheckCircle2 size={15} />
                {successMessage}
              </div>
            )}

            {!successMessage && (
              <>
                {/* Summary cards */}
                <div
                  style={{
                    background: '#162040',
                    border: '1px solid rgba(255,140,80,0.12)',
                    borderRadius: 12,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                    Owner Information
                  </div>
                  <div style={{ fontSize: 13, color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Name: </span>{formData.ownerName}</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Email: </span>{formData.email}</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Phone: </span>{formData.ownerPhone}</div>
                </div>

                <div
                  style={{
                    background: '#162040',
                    border: '1px solid rgba(255,140,80,0.12)',
                    borderRadius: 12,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                    Business Information
                  </div>
                  <div style={{ fontSize: 13, color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Name: </span>{formData.businessName}</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Category: </span>{formData.businessCategory}</div>
                  {formData.businessEmail && (
                    <div style={{ fontSize: 13, color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Email: </span>{formData.businessEmail}</div>
                  )}
                  {formData.businessPhone && (
                    <div style={{ fontSize: 13, color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Phone: </span>{formData.businessPhone}</div>
                  )}
                  {formData.businessWebsite && (
                    <div style={{ fontSize: 13, color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Website: </span>{formData.businessWebsite}</div>
                  )}
                </div>

                <div
                  style={{
                    background: 'rgba(249,115,22,0.06)',
                    border: '1px solid rgba(249,115,22,0.15)',
                    borderRadius: 10,
                    padding: '12px 14px',
                  }}
                >
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                    After creating your account, you'll complete your business setup including location, hours, photos, and documents.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={handlePrevStep} disabled={loading} style={secondaryBtnStyle}>
                    Back
                  </button>
                  <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, opacity: loading ? 0.7 : 1 }}>
                    {loading ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Creating...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
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
