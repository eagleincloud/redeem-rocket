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
    navigate('/register/features');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center p-4 py-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-32 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-3xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Redeem Rocket</span>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {stepLabels.map((label, idx) => {
              const step = idx + 1;
              const isCompleted = currentStep > step;
              const isActive = currentStep === step;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      isCompleted ? 'bg-green-500 text-white border-2 border-green-500' :
                      isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-transparent' :
                      'bg-white/10 text-white/40 border-2 border-white/20'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step}
                    </div>
                    <span className={`text-xs mt-2 font-medium hidden sm:block whitespace-nowrap transition-all ${
                      isActive ? 'text-blue-300' : isCompleted ? 'text-green-400' : 'text-white/40'
                    }`}>
                      {label}
                    </span>
                  </div>
                  {step < TOTAL_STEPS && (
                    <div className={`flex-1 h-1 mx-3 rounded-full transition-all duration-300 ${
                      currentStep > step ? 'bg-green-500' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Step 1: Business Basics */}
          {currentStep === 1 && (
            <div className="p-8 md:p-10">
              <div className="mb-8">
                <Badge className="mb-4 bg-blue-500/30 text-blue-200 border-blue-500/50 hover:bg-blue-500/40">Step 1 of 3</Badge>
                <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">
                  Tell us about your business
                </h2>
                <p className="text-white/60">We'll use this to personalize your experience</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="business-name" className="text-white font-semibold mb-2 block">
                    Business Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="business-name"
                    placeholder="e.g. Sunrise Bakery, NexGen Tech..."
                    value={formData.businessName}
                    onChange={e => setSingle('businessName', e.target.value)}
                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:bg-white/15"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email" className="text-white font-semibold mb-2 block">
                      Email Address <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@business.com"
                      value={formData.email}
                      onChange={e => setSingle('email', e.target.value)}
                      className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:bg-white/15"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white font-semibold mb-2 block">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={e => setSingle('phone', e.target.value)}
                      className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:bg-white/15"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location" className="text-white font-semibold mb-2 block">
                    Business Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="City, State / Country"
                    value={formData.location}
                    onChange={e => setSingle('location', e.target.value)}
                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:bg-white/15"
                  />
                </div>

                {/* Social Media */}
                <div>
                  <Label className="text-white font-semibold mb-2 block">
                    Where are you active? <span className="text-white/50 text-sm font-normal">(optional)</span>
                  </Label>
                  <p className="text-white/50 text-sm mb-4">Select your social media platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {socialMediaOptions.map(platform => {
                      const sel = formData.socialMedia.includes(platform);
                      return (
                        <button
                          key={platform}
                          onClick={() => toggleArray('socialMedia', platform)}
                          className={`px-4 py-2 rounded-full border transition-all duration-300 text-sm font-medium ${
                            sel
                              ? 'bg-blue-500/30 border-blue-400 text-blue-200'
                              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                          }`}
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
            <div className="p-8 md:p-10">
              <div className="mb-8">
                <Badge className="mb-4 bg-purple-500/30 text-purple-200 border-purple-500/50 hover:bg-purple-500/40">Step 2 of 3</Badge>
                <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">
                  Your Business Profile
                </h2>
                <p className="text-white/60">Help us recommend the perfect features and style</p>
              </div>

              {/* Category Grid */}
              <div className="mb-8">
                <Label className="text-white font-semibold text-base mb-4 block">
                  Business Category <span className="text-red-400">*</span>
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {categoryList.map(cat => {
                    const sel = formData.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSingle('category', cat.id)}
                        className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-300 border-2 hover:scale-105 ${
                          sel
                            ? 'bg-white/15 border-blue-400 shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl">{cat.emoji}</span>
                        <span className={`text-xs text-center font-medium leading-tight ${sel ? 'text-blue-200' : 'text-white/70'}`}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Team Size */}
              <div className="mb-8">
                <Label className="text-white font-semibold text-base mb-4 block">
                  Team Size <span className="text-red-400">*</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {teamSizeOptions.map(opt => {
                    const sel = formData.teamSize === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSingle('teamSize', opt.id)}
                        className={`p-4 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-300 border-2 ${
                          sel
                            ? 'bg-blue-500/20 border-blue-400 text-blue-100'
                            : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        <span className="text-sm font-bold">{opt.label}</span>
                        <span className="text-xs text-white/50">{opt.sublabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Business Stage */}
              <div className="mb-8">
                <Label className="text-white font-semibold text-base mb-4 block">
                  Business Stage <span className="text-red-400">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {businessStageOptions.map(opt => {
                    const sel = formData.businessStage === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSingle('businessStage', opt.id)}
                        className={`p-4 rounded-xl flex items-center gap-3 transition-all duration-300 border-2 ${
                          sel
                            ? 'bg-purple-500/20 border-purple-400'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <div className="text-left">
                          <div className={`font-semibold ${sel ? 'text-purple-200' : 'text-white/80'}`}>{opt.label}</div>
                          <div className="text-xs text-white/50">{opt.sublabel}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <Label className="text-white font-semibold text-base mb-4 block">Target Audience</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {targetAudienceOptions.map(opt => {
                    const sel = formData.targetAudience === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSingle('targetAudience', opt.id)}
                        className={`p-4 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-300 border-2 ${
                          sel
                            ? 'bg-green-500/20 border-green-400 text-green-100'
                            : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="text-sm font-bold">{opt.label}</span>
                        <span className="text-xs text-white/50">{opt.sublabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Goals & Challenges */}
          {currentStep === 3 && (
            <div className="p-8 md:p-10">
              <div className="mb-8">
                <Badge className="mb-4 bg-green-500/30 text-green-200 border-green-500/50 hover:bg-green-500/40">Step 3 of 3</Badge>
                <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">
                  Goals & Challenges
                </h2>
                <p className="text-white/60">What do you want to achieve? This helps us recommend features.</p>
              </div>

              {/* Business Goals */}
              <div className="mb-8">
                <Label className="text-white font-semibold text-base mb-4 block">
                  Business Goals <span className="text-red-400">*</span>
                  <span className="text-white/50 font-normal text-sm ml-2">(select all that apply)</span>
                </Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {goals.map(goal => {
                    const Icon = goal.icon;
                    const sel = formData.goals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        onClick={() => toggleArray('goals', goal.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                          sel
                            ? 'bg-blue-500/20 border-blue-400 text-blue-100'
                            : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            backgroundColor: sel ? goal.color + '40' : 'transparent',
                            color: sel ? goal.color : 'white'
                          }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium">{goal.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Challenges */}
              <div>
                <Label className="text-white font-semibold text-base mb-4 block">
                  Current Challenges
                  <span className="text-white/50 font-normal text-sm ml-2">(optional)</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {challenges.map(ch => {
                    const sel = formData.challenges.includes(ch);
                    return (
                      <button
                        key={ch}
                        onClick={() => toggleArray('challenges', ch)}
                        className={`px-4 py-2 rounded-full border transition-all duration-300 text-sm font-medium ${
                          sel
                            ? 'bg-orange-500/30 border-orange-400 text-orange-200'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="px-8 pb-8 md:px-10 md:pb-10 flex items-center gap-4 border-t border-white/10">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(s => s - 1)}
                className="flex-1 h-11 gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              className={`flex-1 h-11 gap-2 font-bold text-white transition-all ${
                canGoNext()
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {currentStep < TOTAL_STEPS ? (
                <>Next <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Select Features <Rocket className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
