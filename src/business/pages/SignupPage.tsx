import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { registerBusinessWithPassword, validatePassword } from '@/app/lib/authService';
import { useAuthBusiness } from '@/business/context/BusinessContext';
import { AlertCircle, Loader2, Eye, EyeOff, CheckCircle2, AlertTriangle, Upload, X } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <div className="text-center">
            <h1 className="text-3xl font-bold">🏪</h1>
          </div>
          <CardTitle className="text-center">Create Business Account</CardTitle>
          <CardDescription className="text-center">
            {step === 1 && 'Step 1: Set your credentials'}
            {step === 2 && 'Step 2: Owner information'}
            {step === 3 && 'Step 3: Business basics'}
            {step === 4 && 'Step 4: Business contact details'}
            {step === 5 && 'Account created!'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Progress bar */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Basic Details */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="you@business.com"
                  value={formData.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateForm({ password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {formData.password && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Password Requirements:</div>
                  <div className="space-y-1">
                    {[
                      { check: formData.password.length >= 8, label: 'At least 8 characters' },
                      { check: /[A-Z]/.test(formData.password), label: 'One uppercase letter' },
                      { check: /[a-z]/.test(formData.password), label: 'One lowercase letter' },
                      { check: /[0-9]/.test(formData.password), label: 'One number' },
                    ].map((req, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 text-sm ${
                          req.check ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {req.check ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {req.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => updateForm({ confirmPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {formData.confirmPassword && !passwordsMatch && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Passwords do not match
                </div>
              )}

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => updateForm({ agreeToTerms: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline" onClick={(e) => e.preventDefault()}>
                    Terms and Conditions
                  </a>
                </label>
              </div>

              <Button type="submit" className="w-full">
                Next: Owner Information
              </Button>

              <div className="text-center text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Log in
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Owner Information */}
          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Your Full Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={formData.ownerName}
                  onChange={(e) => updateForm({ ownerName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="9876543210"
                  value={formData.ownerPhone}
                  onChange={(e) => updateForm({ ownerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  maxLength={10}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">10-digit phone number</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Profile Photo (Optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
                {ownerPhotoPreview ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                    <img src={ownerPhotoPreview} alt="Preview" className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Photo uploaded</div>
                      <div className="text-xs text-gray-500">Click below to change</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Upload photo</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bio (Optional)</label>
                <textarea
                  placeholder="Tell us about yourself..."
                  value={formData.ownerBio}
                  onChange={(e) => updateForm({ ownerBio: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  Next: Business Info
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Business Basics */}
          {step === 3 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Business Name</label>
                <Input
                  type="text"
                  placeholder="My Awesome Store"
                  value={formData.businessName}
                  onChange={(e) => updateForm({ businessName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Business Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUSINESS_TYPES.map(({ emoji, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => updateForm({ businessCategory: label })}
                      className={`p-3 rounded-lg border-2 transition text-center ${
                        formData.businessCategory === label
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{emoji}</div>
                      <div className="text-xs font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  Next: Contact Details
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Business Contact Details */}
          {step === 4 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Business Email (Optional)</label>
                <Input
                  type="email"
                  placeholder="business@example.com"
                  value={formData.businessEmail}
                  onChange={(e) => updateForm({ businessEmail: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Business Phone (Optional)</label>
                <Input
                  type="tel"
                  placeholder="9876543210"
                  value={formData.businessPhone}
                  onChange={(e) => updateForm({ businessPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp Number (Optional)</label>
                <Input
                  type="tel"
                  placeholder="9876543210"
                  value={formData.businessWhatsApp}
                  onChange={(e) => updateForm({ businessWhatsApp: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Website (Optional)</label>
                <Input
                  type="text"
                  placeholder="https://example.com"
                  value={formData.businessWebsite}
                  onChange={(e) => updateForm({ businessWebsite: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  Review & Submit
                </Button>
              </div>
            </form>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  {successMessage}
                </div>
              )}

              {!successMessage && (
                <>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase">Owner Information</div>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm"><strong>Name:</strong> {formData.ownerName}</div>
                        <div className="text-sm"><strong>Email:</strong> {formData.email}</div>
                        <div className="text-sm"><strong>Phone:</strong> {formData.ownerPhone}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase">Business Information</div>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm"><strong>Name:</strong> {formData.businessName}</div>
                        <div className="text-sm"><strong>Category:</strong> {formData.businessCategory}</div>
                        {formData.businessEmail && <div className="text-sm"><strong>Email:</strong> {formData.businessEmail}</div>}
                        {formData.businessPhone && <div className="text-sm"><strong>Phone:</strong> {formData.businessPhone}</div>}
                        {formData.businessWebsite && <div className="text-sm"><strong>Website:</strong> {formData.businessWebsite}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-900">
                      After creating your account, you'll complete your business setup including location, hours, photos, and documents.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handlePrevStep}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
