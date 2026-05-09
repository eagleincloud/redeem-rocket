/**
 * Smart Onboarding Component (Work Stream 1)
 * 5-step feature discovery flow with personalized recommendations
 * Phase 1: Business Discovery with feature preference questions
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronRight, ChevronLeft, Check, Package, Users, Mail, Zap, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useFeatures, FeaturePreferences } from '../../hooks/useFeatures';

interface Question {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  featureKey: keyof FeaturePreferences;
  benefits: string[];
}

const ONBOARDING_QUESTIONS: Question[] = [
  {
    id: '1',
    title: '📦 Do you want to manage Products/Services?',
    description: 'Create a digital catalog of your products/services that you can share with customers. Include photos, descriptions, pricing. Perfect if you sell physical products or offer services online.',
    icon: <Package className="w-12 h-12" />,
    featureKey: 'product_catalog',
    benefits: [
      'Digital catalog of your products/services',
      'Photo uploads and descriptions',
      'Pricing management',
      'Category organization'
    ]
  },
  {
    id: '2',
    title: '👥 Do you want to manage Leads & Sales?',
    description: 'Track potential customers, manage their sales journey from first contact to closed deal. See where leads come from, what stage they\'re in, and win/lose reasons. Essential for growing your sales team.',
    icon: <Users className="w-12 h-12" />,
    featureKey: 'lead_management',
    benefits: [
      'Track sales leads through pipeline',
      'Visual stage management',
      'Lead source tracking',
      'Team collaboration'
    ]
  },
  {
    id: '3',
    title: '📧 Do you want to automate Customer Communication?',
    description: 'Set up email sequences that automatically send messages to customers (welcome series, follow-ups, abandoned cart reminders). Keep customers engaged without doing it manually.',
    icon: <Mail className="w-12 h-12" />,
    featureKey: 'email_campaigns',
    benefits: [
      'Email campaign creation',
      'Automated sequences',
      'Email templates',
      'Open & click tracking'
    ]
  },
  {
    id: '4',
    title: '🤖 Do you want Smart Workflow Automation?',
    description: 'Create if-then rules: "If lead comes from website, add to welcome campaign." "If customer makes a purchase, send thank you email." Automate repetitive tasks so your team focuses on what matters.',
    icon: <Zap className="w-12 h-12" />,
    featureKey: 'automation',
    benefits: [
      'Visual workflow builder',
      'Trigger-based automations',
      'Multi-step sequences',
      'Conditional logic'
    ]
  },
  {
    id: '5',
    title: '📱 Do you want Social Media Integration?',
    description: 'Connect your social media accounts (Instagram, Facebook, LinkedIn, Twitter) and post updates from one place. Schedule posts, track engagement, manage all platforms together.',
    icon: <Smartphone className="w-12 h-12" />,
    featureKey: 'social_media',
    benefits: [
      'Multi-platform posting',
      'Post scheduling',
      'Engagement tracking',
      'Social analytics'
    ]
  }
];

interface SmartOnboardingProps {
  onComplete?: (preferences: FeaturePreferences) => void;
}

export default function SmartOnboarding({ onComplete }: SmartOnboardingProps) {
  const { completeOnboarding, skipOnboarding } = useFeatures();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<FeaturePreferences>({
    product_catalog: false,
    lead_management: false,
    email_campaigns: false,
    automation: false,
    social_media: false
  });
  const [isReview, setIsReview] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
  const progress = Math.round(((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100);

  const handleYes = () => {
    setPreferences(prev => ({
      ...prev,
      [currentQuestion.featureKey]: true
    }));
    handleNext();
  };

  const handleNo = () => {
    setPreferences(prev => ({
      ...prev,
      [currentQuestion.featureKey]: false
    }));
    handleNext();
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsReview(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTogglePreference = (key: keyof FeaturePreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      await completeOnboarding(preferences);
      toast.success('Setup complete! Welcome to Redeem Rocket 🚀');

      if (onComplete) {
        onComplete(preferences);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete onboarding';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      await skipOnboarding();
      toast.info('Onboarding skipped. You can customize features anytime from Settings.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to skip onboarding';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const enabledCount = Object.values(preferences).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Redeem Rocket 🚀</h1>
          <p className="text-lg text-gray-600">
            Let's personalize your experience by discovering which features you need
          </p>
        </div>

        {!isReview ? (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Question {currentStep + 1} of {ONBOARDING_QUESTIONS.length}
                </span>
                <span className="text-sm font-medium text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <Card className="mb-6 shadow-lg border-0">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4 text-blue-600">
                    {currentQuestion.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {currentQuestion.title}
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {currentQuestion.description}
                  </p>
                </div>

                {/* Benefits List */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">What you'll get:</h3>
                  <ul className="space-y-2">
                    {currentQuestion.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Yes/No Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleNo}
                    variant="outline"
                    className="h-12 text-lg"
                  >
                    Not needed
                  </Button>
                  <Button
                    onClick={handleYes}
                    className="h-12 text-lg bg-green-600 hover:bg-green-700"
                  >
                    Yes, I want this!
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation & Skip */}
            <div className="flex justify-between items-center">
              <Button
                onClick={handleBack}
                variant="ghost"
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                onClick={handleSkip}
                variant="ghost"
                className="text-gray-500"
              >
                Skip for now
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Review Screen */}
            <Card className="mb-6 shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle>Review Your Setup</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    You've selected <strong>{enabledCount}</strong> feature{enabledCount !== 1 ? 's' : ''} to get started with:
                  </p>

                  {/* Feature Toggles for Review */}
                  <div className="space-y-3">
                    {ONBOARDING_QUESTIONS.map(q => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleTogglePreference(q.featureKey)}
                      >
                        <div className="flex items-center gap-3">
                          {preferences[q.featureKey] ? (
                            <Check className="w-6 h-6 text-green-600" />
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded" />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">{q.title.split('?')[0]}</h3>
                            <p className="text-sm text-gray-500">{q.description.substring(0, 60)}...</p>
                          </div>
                        </div>
                        {preferences[q.featureKey] && (
                          <Badge className="bg-green-100 text-green-800">Selected</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    💡 <strong>Tip:</strong> You can enable or disable any feature anytime from Settings. This is just your starting setup.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => setIsReview(false)}
                    variant="outline"
                    className="h-12 text-lg"
                    disabled={loading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleComplete}
                    className="h-12 text-lg bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Setting up...' : 'Let\'s Go! 🚀'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
