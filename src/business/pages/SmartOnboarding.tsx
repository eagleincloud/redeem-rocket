import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronLeft, Rocket } from 'lucide-react';

// Screen 1: Welcome
const WelcomeScreen: React.FC<{ onNext: () => void }> = ({ onNext }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/20 via-background to-background px-6"
  >
    <div className="text-center max-w-md space-y-8">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Rocket className="w-10 h-10 text-primary-foreground" />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Build Your Business App</h1>
        <p className="text-lg text-muted-foreground">
          Create a personalized platform in minutes. Select features, customize your brand, and go live instantly.
        </p>
      </div>

      <div className="pt-8">
        <Button onClick={onNext} className="w-full h-12 text-base">
          Get Started
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  </motion.div>
);

// Screen 2: Business Goals
const BusinessGoalsScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const goals = [
    { id: 'customers', label: 'Get New Customers', icon: '👥' },
    { id: 'sales', label: 'Increase Sales', icon: '📈' },
    { id: 'leads', label: 'Manage Leads', icon: '🎯' },
    { id: 'campaigns', label: 'Run Marketing Campaigns', icon: '📢' },
    { id: 'brand', label: 'Build Brand', icon: '🎨' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-background px-6 py-12"
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Question 1 of 6</div>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/6 bg-primary rounded-full transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">What do you want to achieve?</h2>
          <p className="text-muted-foreground">Select all that apply</p>
        </div>

        <div className="space-y-3">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setSelected(s => s.includes(goal.id) ? s.filter(x => x !== goal.id) : [...s, goal.id])}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                selected.includes(goal.id)
                  ? 'border-primary bg-primary/10'
                  : 'border-white/20 bg-white/5 hover:border-primary/50'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(goal.id)}
                onChange={() => {}}
                className="w-5 h-5 cursor-pointer"
              />
              <span className="text-2xl">{goal.icon}</span>
              <span className="text-foreground font-medium">{goal.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-4 pt-8">
          <Button onClick={onBack} variant="outline" className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext} disabled={selected.length === 0} className="flex-1">
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Screen 3: Business Details
const BusinessDetailsScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    phone: '',
    email: '',
  });

  const categories = [
    'Retail',
    'Restaurant',
    'E-Commerce',
    'Services',
    'B2B',
    'Healthcare',
    'Education',
    'Real Estate',
    'Other',
  ];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.name && formData.category && (formData.phone || formData.email);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-background px-6 py-12"
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Question 2 of 6</div>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-2/6 bg-primary rounded-full transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Tell us about your business</h2>
          <p className="text-muted-foreground">This helps us personalize your experience</p>
        </div>

        <div className="space-y-4">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              placeholder="e.g., My Awesome Business"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="backdrop-blur-md bg-white/5 border-white/20"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Business Category *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 rounded-md backdrop-blur-md bg-white/5 border border-white/20 text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="City, State"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="backdrop-blur-md bg-white/5 border-white/20"
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="backdrop-blur-md bg-white/5 border-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="hello@business.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="backdrop-blur-md bg-white/5 border-white/20"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-8">
          <Button onClick={onBack} variant="outline" className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext} disabled={!isValid} className="flex-1">
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Screen 4: Feature Recommendations
const FeatureRecommendationsScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [features, setFeatures] = useState({
    leads: true,
    whatsapp: true,
    coupons: true,
    ai: false,
  });

  const recommendations = [
    { id: 'leads', label: 'Lead Management', icon: '👥', description: 'Track and manage customer leads' },
    { id: 'whatsapp', label: 'WhatsApp Marketing', icon: '💬', description: 'Send messages to customers' },
    { id: 'coupons', label: 'Coupons & Offers', icon: '🎟️', description: 'Create promotions and discounts' },
    { id: 'ai', label: 'AI Assistant', icon: '🤖', description: 'Smart business recommendations' },
  ];

  const toggleFeature = (id: string) => {
    setFeatures(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-background px-6 py-12"
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Question 3 of 6</div>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-3/6 bg-primary rounded-full transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Recommended features for you</h2>
          <p className="text-muted-foreground">Toggle features on/off to customize your app</p>
        </div>

        <div className="space-y-3">
          {recommendations.map((feature) => (
            <div
              key={feature.id}
              className="p-4 rounded-lg backdrop-blur-md bg-white/5 border border-white/20 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <p className="font-medium text-foreground">{feature.label}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={features[feature.id as keyof typeof features]}
                  onChange={() => toggleFeature(feature.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-8">
          <Button onClick={onBack} variant="outline" className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext} className="flex-1">
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Screen 5: Branding & Theme
const BrandingScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [branding, setBranding] = useState({
    primaryColor: '#FF9E1B',
    theme: 'dark',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-background px-6 py-12"
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Question 4 of 6</div>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-4/6 bg-primary rounded-full transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Customize your brand</h2>
          <p className="text-muted-foreground">Make your app uniquely yours</p>
        </div>

        <div className="space-y-6">
          {/* Color Picker */}
          <div className="space-y-3">
            <Label htmlFor="color">Primary Color</Label>
            <div className="flex items-center gap-4">
              <input
                id="color"
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-20 h-20 rounded-lg cursor-pointer border border-white/20"
              />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current color:</p>
                <p className="text-lg font-mono text-foreground">{branding.primaryColor}</p>
              </div>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-2 gap-4">
              {['light', 'dark'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setBranding(prev => ({ ...prev, theme }))}
                  className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-3 ${
                    branding.theme === theme
                      ? 'border-primary bg-primary/10'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`} />
                  <span className="text-foreground font-medium capitalize">{theme} Mode</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-8">
          <Button onClick={onBack} variant="outline" className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext} className="flex-1">
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Screen 6: App Type Selection
const AppTypeScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [selectedType, setSelectedType] = useState('');

  const appTypes = [
    { id: 'simple', label: 'Simple Business App', description: 'Basic features to get started' },
    { id: 'marketplace', label: 'Marketplace App', description: 'Multiple sellers and products' },
    { id: 'crm', label: 'CRM + Marketing Heavy', description: 'Advanced sales and marketing tools' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-background px-6 py-12"
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Question 5 of 6</div>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-5/6 bg-primary rounded-full transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Choose your app style</h2>
          <p className="text-muted-foreground">Different templates for different businesses</p>
        </div>

        <div className="space-y-3">
          {appTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                selectedType === type.id
                  ? 'border-primary bg-primary/10'
                  : 'border-white/20 bg-white/5 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <input
                  type="radio"
                  checked={selectedType === type.id}
                  onChange={() => {}}
                  className="w-5 h-5 cursor-pointer"
                />
                <div>
                  <p className="font-medium text-foreground">{type.label}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-4 pt-8">
          <Button onClick={onBack} variant="outline" className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext} disabled={!selectedType} className="flex-1">
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Screen 7: Preview
const PreviewScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-background px-6 py-12"
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Question 6 of 6</div>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-6/6 bg-primary rounded-full transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Preview your app</h2>
          <p className="text-muted-foreground">Here's how your app will look</p>
        </div>

        {/* Preview Card */}
        <div className="p-8 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 space-y-6">
          <div className="flex items-center justify-center h-64 bg-white/5 rounded-lg border border-white/10">
            <div className="text-center">
              <Rocket className="w-16 h-16 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Your app preview</p>
              <p className="text-sm text-muted-foreground mt-2">Ready to launch!</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <p className="text-2xl font-bold text-primary">👥</p>
              <p className="text-xs text-muted-foreground mt-2">Leads</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <p className="text-2xl font-bold text-primary">📧</p>
              <p className="text-xs text-muted-foreground mt-2">Email</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
              <p className="text-2xl font-bold text-primary">📊</p>
              <p className="text-xs text-muted-foreground mt-2">Analytics</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-8">
          <Button onClick={onBack} variant="outline" className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext} className="flex-1">
            Go Live
            <Rocket className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
export const SmartOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const screens = [
    <WelcomeScreen key="welcome" onNext={() => setStep(1)} />,
    <BusinessGoalsScreen key="goals" onNext={() => setStep(2)} onBack={() => setStep(0)} />,
    <BusinessDetailsScreen key="details" onNext={() => setStep(3)} onBack={() => setStep(1)} />,
    <FeatureRecommendationsScreen key="features" onNext={() => setStep(4)} onBack={() => setStep(2)} />,
    <BrandingScreen key="branding" onNext={() => setStep(5)} onBack={() => setStep(3)} />,
    <AppTypeScreen key="type" onNext={() => setStep(6)} onBack={() => setStep(4)} />,
    <PreviewScreen key="preview" onNext={() => navigate('/app')} onBack={() => setStep(5)} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {screens[step]}
      </AnimatePresence>
    </div>
  );
};

export default SmartOnboarding;
