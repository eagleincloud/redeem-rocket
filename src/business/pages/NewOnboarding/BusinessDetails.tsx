import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { saveAppData } from '@/business/utils/onboarding/appState';
import { categoryList } from '@/business/utils/onboarding/categoryStyles';
import {
  Users, TrendingUp, Target, Megaphone, Award, Zap,
  Heart, Globe, Headphones, BarChart2, ShoppingBag,
  Clock, ChevronRight, ChevronLeft, Rocket, CheckCircle2,
} from 'lucide-react';

const goals = [
  { id: 'new-customers', label: 'Get New Customers', icon: Users, color: '#3B82F6' },
  { id: 'increase-sales', label: 'Increase Sales', icon: TrendingUp, color: '#10B981' },
  { id: 'manage-leads', label: 'Manage Leads', icon: Target, color: '#F59E0B' },
  { id: 'marketing-campaigns', label: 'Run Marketing Campaigns', icon: Megaphone, color: '#8B5CF6' },
  { id: 'build-brand', label: 'Build Brand Awareness', icon: Award, color: '#EC4899' },
  { id: 'automate-workflows', label: 'Automate Workflows', icon: Zap, color: '#F97316' },
  { id: 'boost-retention', label: 'Boost Customer Retention', icon: Heart, color: '#EF4444' },
  { id: 'online-presence', label: 'Expand Online Presence', icon: Globe, color: '#06B6D4' },
  { id: 'customer-service', label: 'Improve Customer Service', icon: Headphones, color: '#6366F1' },
  { id: 'analyze-data', label: 'Analyze Business Data', icon: BarChart2, color: '#84CC16' },
  { id: 'ecommerce', label: 'Sell Products Online', icon: ShoppingBag, color: '#F59E0B' },
  { id: 'appointments', label: 'Manage Appointments', icon: Clock, color: '#14B8A6' },
];

const challenges = [
  'Finding new customers', 'Retaining existing customers', 'Managing customer data',
  'Running effective marketing', 'Tracking sales performance', 'Managing appointments/bookings',
  'Communicating with customers', 'Managing team productivity', 'Tracking inventory',
  'Handling customer complaints', 'Building online reputation', 'Competing with bigger brands',
];

const teamSizeOptions = [
  { id: 'solo', label: 'Solo', sublabel: 'Just me', emoji: '🙋' },
  { id: '2-10', label: '2–10', sublabel: 'Small team', emoji: '👥' },
  { id: '11-50', label: '11–50', sublabel: 'Growing team', emoji: '🏢' },
  { id: '50+', label: '50+', sublabel: 'Large team', emoji: '🏗️' },
];

const businessStageOptions = [
  { id: 'startup', label: 'Just Starting', sublabel: 'New business', emoji: '🌱' },
  { id: 'growing', label: 'Growing', sublabel: '1–3 years in', emoji: '📈' },
  { id: 'established', label: 'Established', sublabel: '3–10 years', emoji: '🏆' },
  { id: 'scaling', label: 'Scaling Fast', sublabel: 'Rapid expansion', emoji: '🚀' },
];

const targetAudienceOptions = [
  { id: 'local', label: 'Local', sublabel: 'Nearby customers', emoji: '📍' },
  { id: 'regional', label: 'Regional', sublabel: 'Multi-city reach', emoji: '🗺️' },
  { id: 'national', label: 'National', sublabel: 'Country-wide', emoji: '🌐' },
  { id: 'international', label: 'International', sublabel: 'Global market', emoji: '🌍' },
];

const monthlyCustomerOptions = [
  { id: 'under-50', label: 'Under 50', emoji: '🌱' },
  { id: '50-200', label: '50–200', emoji: '📊' },
  { id: '200-1000', label: '200–1,000', emoji: '📈' },
  { id: '1000+', label: '1,000+', emoji: '🚀' },
];

const socialMediaOptions = [
  'Instagram', 'Facebook', 'WhatsApp', 'YouTube', 'LinkedIn', 'Twitter/X', 'TikTok', 'Google Business',
];

const TOTAL_STEPS = 3;
const stepLabels = ['Business Basics', 'Category & Profile', 'Goals & Audience'];

export default function BusinessDetails() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    category: '',
    location: '',
    teamSize: '',
    businessStage: '',
    targetAudience: '',
    goals: [] as string[],
    challenges: [] as string[],
    monthlyCustomers: '',
    socialMedia: [] as string[],
  });

  const toggleArray = (key: keyof typeof formData, value: string) => {
    const arr = formData[key] as string[];
    setFormData(prev => ({
      ...prev,
      [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
    }));
  };

  const setSingle = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const isStep1Valid = formData.businessName.trim() && formData.email.trim();
  const isStep2Valid = formData.category && formData.teamSize && formData.businessStage;
  const isStep3Valid = formData.goals.length > 0;

  const canGoNext = () => {
    if (currentStep === 1) return isStep1Valid;
    if (currentStep === 2) return isStep2Valid;
    return isStep3Valid;
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) setCurrentStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = () => {
    saveAppData(formData);
    navigate('/features');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 flex items-center justify-center p-4 py-10">
      <div className="max-w-3xl w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl" style={{ fontWeight: 700 }}>Redeem Rocket</span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-8 px-2">
          {stepLabels.map((label, idx) => {
            const step = idx + 1;
            const isCompleted = currentStep > step;
            const isActive = currentStep === step;
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted ? 'bg-green-500 border-green-500' :
                    isActive ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-white/30'
                  }`}>
                    {isCompleted
                      ? <CheckCircle2 className="w-5 h-5 text-white" />
                      : <span className={`text-sm ${isActive ? 'text-white' : 'text-white/40'}`} style={{ fontWeight: 600 }}>{step}</span>
                    }
                  </div>
                  <span className={`text-xs hidden sm:block whitespace-nowrap transition-all ${isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-white/40'}`}>
                    {label}
                  </span>
                </div>
                {step < TOTAL_STEPS && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all duration-500 ${
                    currentStep > step ? 'bg-green-500' : 'bg-white/20'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Step 1: Business Basics */}
          {currentStep === 1 && (
            <div className="p-8">
              <div className="mb-8">
                <Badge className="mb-3 bg-blue-100 text-blue-700 border-0">Step 1 of 3</Badge>
                <h2 className="text-gray-900" style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  Tell us about your business
                </h2>
                <p className="text-gray-500 mt-1">We'll use this to personalise your experience</p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="business-name">Business Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="business-name"
                    placeholder="e.g. Sunrise Bakery, NexGen Tech..."
                    value={formData.businessName}
                    onChange={e => setSingle('businessName', e.target.value)}
                    className="mt-2 h-12"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@business.com"
                      value={formData.email}
                      onChange={e => setSingle('email', e.target.value)}
                      className="mt-2 h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={e => setSingle('phone', e.target.value)}
                      className="mt-2 h-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Business Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State / Country"
                    value={formData.location}
                    onChange={e => setSingle('location', e.target.value)}
                    className="mt-2 h-12"
                  />
                </div>

                {/* Social Media */}
                <div>
                  <Label>Where are you active? <span className="text-gray-400 text-sm">(optional)</span></Label>
                  <p className="text-sm text-gray-500 mb-3">Select your social media platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {socialMediaOptions.map(platform => {
                      const sel = formData.socialMedia.includes(platform);
                      return (
                        <button
                          key={platform}
                          onClick={() => toggleArray('socialMedia', platform)}
                          className={`px-4 py-2 rounded-full border-2 text-sm transition-all ${
                            sel ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                          }`}
                          style={{ fontWeight: sel ? 600 : 400 }}
                        >
                          {platform}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Category & Profile */}
          {currentStep === 2 && (
            <div className="p-8">
              <div className="mb-6">
                <Badge className="mb-3 bg-purple-100 text-purple-700 border-0">Step 2 of 3</Badge>
                <h2 className="text-gray-900" style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  Your Business Profile
                </h2>
                <p className="text-gray-500 mt-1">Help us recommend the perfect features and style</p>
              </div>

              {/* Category Grid */}
              <div className="mb-7">
                <Label className="text-base mb-3 block">Business Category <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categoryList.map(cat => {
                    const sel = formData.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSingle('category', cat.id)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all hover:scale-105 ${
                          sel ? 'border-blue-600 shadow-md shadow-blue-100' : 'border-gray-200 hover:border-blue-300'
                        }`}
                        style={{ backgroundColor: sel ? cat.bgColor : '#FAFAFA' }}
                      >
                        <span style={{ fontSize: '1.6rem' }}>{cat.emoji}</span>
                        <span className="text-xs text-center text-gray-700 leading-tight" style={{ fontWeight: sel ? 600 : 400 }}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Team Size */}
              <div className="mb-6">
                <Label className="text-base mb-3 block">Team Size <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {teamSizeOptions.map(opt => {
                    const sel = formData.teamSize === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSingle('teamSize', opt.id)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                          sel ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span style={{ fontSize: '1.4rem' }}>{opt.emoji}</span>
                        <span className="text-sm" style={{ fontWeight: 700 }}>{opt.label}</span>
                        <span className="text-xs text-gray-500">{opt.sublabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Business Stage */}
              <div className="mb-6">
                <Label className="text-base mb-3 block">Business Stage <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-3">
                  {businessStageOptions.map(opt => {
                    const sel = formData.businessStage === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSingle('businessStage', opt.id)}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                          sel ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span style={{ fontSize: '1.4rem' }}>{opt.emoji}</span>
                        <div className="text-left">
                          <div className="text-sm" style={{ fontWeight: 600 }}>{opt.label}</div>
                          <div className="text-xs text-gray-500">{opt.sublabel}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <Label className="text-base mb-3 block">Target Audience</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {targetAudienceOptions.map(opt => {
                    const sel = formData.targetAudience === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSingle('targetAudience', opt.id)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                          sel ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span style={{ fontSize: '1.3rem' }}>{opt.emoji}</span>
                        <span className="text-sm" style={{ fontWeight: sel ? 600 : 400 }}>{opt.label}</span>
                        <span className="text-xs text-gray-500">{opt.sublabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Goals & Audience */}
          {currentStep === 3 && (
            <div className="p-8">
              <div className="mb-6">
                <Badge className="mb-3 bg-green-100 text-green-700 border-0">Step 3 of 3</Badge>
                <h2 className="text-gray-900" style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  Goals & Challenges
                </h2>
                <p className="text-gray-500 mt-1">What do you want to achieve? This helps us recommend features.</p>
              </div>

              {/* Business Goals */}
              <div className="mb-7">
                <Label className="text-base mb-3 block">
                  Business Goals <span className="text-red-500">*</span>
                  <span className="text-sm text-gray-400 ml-2">(select all that apply)</span>
                </Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {goals.map(goal => {
                    const Icon = goal.icon;
                    const sel = formData.goals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        onClick={() => toggleArray('goals', goal.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                          sel ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: sel ? goal.color : '#F3F4F6' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: sel ? '#FFFFFF' : goal.color }} />
                        </div>
                        <span className="text-sm" style={{ fontWeight: sel ? 600 : 400, color: sel ? '#1E3A8A' : '#374151' }}>
                          {goal.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Challenges */}
              <div className="mb-7">
                <Label className="text-base mb-3 block">
                  Current Challenges
                  <span className="text-sm text-gray-400 ml-2">(optional)</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {challenges.map(ch => {
                    const sel = formData.challenges.includes(ch);
                    return (
                      <button
                        key={ch}
                        onClick={() => toggleArray('challenges', ch)}
                        className={`px-3 py-1.5 rounded-full border-2 text-sm transition-all ${
                          sel ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-orange-300'
                        }`}
                        style={{ fontWeight: sel ? 600 : 400 }}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Customers */}
              <div>
                <Label className="text-base mb-3 block">Monthly Customer Volume</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {monthlyCustomerOptions.map(opt => {
                    const sel = formData.monthlyCustomers === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSingle('monthlyCustomers', opt.id)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                          sel ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span style={{ fontSize: '1.3rem' }}>{opt.emoji}</span>
                        <span className="text-sm" style={{ fontWeight: sel ? 600 : 400 }}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="px-8 pb-8 flex items-center gap-4">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(s => s - 1)}
                className="flex-1 h-12 gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex-1 h-12 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {currentStep < TOTAL_STEPS ? (
                <>Next <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Select Features <Rocket className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === currentStep ? 'w-8 bg-white' : i + 1 < currentStep ? 'w-4 bg-green-400' : 'w-4 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}