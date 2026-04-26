import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useBusinessContext } from '../../context/BusinessContext';
import {
  generateThemeWithAI,
  applyTheme,
  saveThemeToDatabase,
  ThemeConfig,
  ThemeGenerationResult,
  OnboardingAnswers,
} from '../../services/ai-theme-generator';
import { ThemePreviewPhase } from './ThemePreviewPhase';
import { DynamicJourneyPhase } from './DynamicJourneyPhase';
import { FeatureShowcasePhase } from './FeatureShowcasePhase';
import { ThemeSelectionPhase } from './ThemeSelectionPhase';
import { DashboardPreviewPhase } from './DashboardPreviewPhase';

type OnboardingPhase =
  | 'welcome'
  | 'features'
  | 'feature-showcase'
  | 'theme-selection'
  | 'dynamic-journey'
  | 'ai-theme-generation'
  | 'theme-preview'
  | 'dashboard-preview'
  | 'completion';

interface OnboardingState {
  businessType?: string;
  selectedFeatures: string[];
  businessDescription?: string;
  targetAudience?: string;
  colorPreference?: string;
  stylePreference?: string;
  dynamicAnswers: Record<string, any>;
  selectedTheme?: ThemeConfig;
}

export function OnboardingOrchestrator() {
  const navigate = useNavigate();
  const { bizUser } = useBusinessContext();

  // Phase management
  const [currentPhase, setCurrentPhase] = useState<OnboardingPhase>('welcome');
  const [themeGenerationLoading, setThemeGenerationLoading] = useState(false);
  const [themeGenerationError, setThemeGenerationError] = useState<string | null>(null);
  const [themeResult, setThemeResult] = useState<ThemeGenerationResult | null>(null);

  // Onboarding answers
  const [state, setState] = useState<OnboardingState>({
    selectedFeatures: [],
    dynamicAnswers: {},
  });

  // Feature selection (Phase 1)
  const handleFeaturesSelected = useCallback((features: string[]) => {
    setState(prev => ({ ...prev, selectedFeatures: features }));
    setCurrentPhase('feature-showcase');
  }, []);

  // Feature showcase (Phase 2)
  const handleFeatureShowcaseComplete = useCallback(() => {
    setCurrentPhase('theme-selection');
  }, []);

  // Theme selection (Phase 3)
  const handleThemeSelected = useCallback((
    businessType: string,
    colorPref?: string,
    stylePref?: string
  ) => {
    setState(prev => ({
      ...prev,
      businessType,
      colorPreference: colorPref,
      stylePreference: stylePref,
    }));
    setCurrentPhase('dynamic-journey');
  }, []);

  // Dynamic journey (Phase 4)
  const handleDynamicJourneyComplete = useCallback((answers: Record<string, any>) => {
    setState(prev => ({ ...prev, dynamicAnswers: answers }));
    setCurrentPhase('ai-theme-generation');
    generateTheme(answers);
  }, []);

  // AI Theme Generation (Phase 5)
  const generateTheme = async (answers: Record<string, any>) => {
    setThemeGenerationLoading(true);
    setThemeGenerationError(null);

    try {
      const onboardingAnswers: OnboardingAnswers = {
        businessType: state.businessType || 'general',
        businessName: bizUser?.business_name || 'My Business',
        selectedFeatures: state.selectedFeatures,
        businessDescription: state.businessDescription,
        targetAudience: state.targetAudience,
        colorPreference: state.colorPreference,
        stylePreference: state.stylePreference,
        additionalNotes: JSON.stringify(answers),
      };

      const result = await generateThemeWithAI(onboardingAnswers);
      setThemeResult(result);
      setCurrentPhase('theme-preview');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate theme';
      setThemeGenerationError(errorMessage);
      // Still advance to preview with fallback theme
      setCurrentPhase('theme-preview');
    } finally {
      setThemeGenerationLoading(false);
    }
  };

  // Theme Preview (Phase 6)
  const handleThemeApplied = useCallback(async (theme: ThemeConfig) => {
    setState(prev => ({ ...prev, selectedTheme: theme }));

    // Apply theme to DOM
    applyTheme(theme);

    // Save to database
    if (bizUser?.id) {
      try {
        await saveThemeToDatabase(bizUser.id, theme, {
          businessType: state.businessType || 'general',
          businessName: bizUser.business_name || 'My Business',
          selectedFeatures: state.selectedFeatures,
          businessDescription: state.businessDescription,
          targetAudience: state.targetAudience,
          colorPreference: state.colorPreference,
          stylePreference: state.stylePreference,
        });
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    }

    setCurrentPhase('dashboard-preview');
  }, [bizUser, state]);

  // Dashboard Preview (Phase 7)
  const handleDashboardPreviewComplete = useCallback(() => {
    setCurrentPhase('completion');
  }, []);

  // Completion (Phase 8)
  const handleOnboardingComplete = useCallback(async () => {
    // Mark onboarding as complete in database
    try {
      // Update user's onboarding status
      // This would call an API to mark onboarding as complete
      // For now, just navigate to dashboard
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }

    // Navigate to dashboard
    navigate('/app');
  }, [navigate]);

  // Navigation
  const goBack = useCallback(() => {
    const phases: OnboardingPhase[] = [
      'welcome',
      'features',
      'feature-showcase',
      'theme-selection',
      'dynamic-journey',
      'ai-theme-generation',
      'theme-preview',
      'dashboard-preview',
      'completion',
    ];

    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex > 0) {
      setCurrentPhase(phases[currentIndex - 1]);
    }
  }, [currentPhase]);

  const skipOnboarding = useCallback(() => {
    navigate('/app');
  }, [navigate]);

  // Render current phase
  const renderPhase = () => {
    switch (currentPhase) {
      case 'welcome':
        return (
          <WelcomePhase
            businessName={bizUser?.business_name}
            onContinue={() => setCurrentPhase('features')}
          />
        );

      case 'features':
        return (
          <FeatureSelectionPhase
            selectedFeatures={state.selectedFeatures}
            onNext={handleFeaturesSelected}
            onSkip={skipOnboarding}
          />
        );

      case 'feature-showcase':
        return (
          <FeatureShowcasePhase
            businessType={state.businessType}
            selectedFeatures={state.selectedFeatures}
            onNext={handleFeatureShowcaseComplete}
            onBack={goBack}
          />
        );

      case 'theme-selection':
        return (
          <ThemeSelectionPhase
            onThemeSelected={handleThemeSelected}
            onBack={goBack}
          />
        );

      case 'dynamic-journey':
        return (
          <DynamicJourneyPhase
            businessType={state.businessType}
            selectedFeatures={state.selectedFeatures}
            onNext={handleDynamicJourneyComplete}
            onBack={goBack}
          />
        );

      case 'ai-theme-generation':
        return (
          <AIThemeGenerationPhase
            isLoading={themeGenerationLoading}
            error={themeGenerationError}
            businessType={state.businessType}
            businessName={bizUser?.business_name}
          />
        );

      case 'theme-preview':
        return themeResult ? (
          <ThemePreviewPhase
            themeResult={themeResult}
            onApply={handleThemeApplied}
            onRegenerate={() => {
              setCurrentPhase('ai-theme-generation');
              generateTheme(state.dynamicAnswers);
            }}
            isLoading={false}
          />
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <Loader className="animate-spin" size={48} />
          </div>
        );

      case 'dashboard-preview':
        return (
          <DashboardPreviewPhase
            theme={state.selectedTheme}
            selectedFeatures={state.selectedFeatures}
            businessName={bizUser?.business_name}
            onComplete={handleDashboardPreviewComplete}
            onBack={goBack}
          />
        );

      case 'completion':
        return (
          <CompletionPhase
            businessName={bizUser?.business_name}
            onContinue={handleOnboardingComplete}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {renderPhase()}
    </div>
  );
}

// Welcome Phase Component
interface WelcomePhaseProps {
  businessName?: string;
  onContinue: () => void;
}

function WelcomePhase({ businessName, onContinue }: WelcomePhaseProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Redeem Rocket
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Hi {businessName}! Let's set up your personalized business platform.
          </p>
          <p className="text-lg text-gray-400">
            In the next few steps, we'll customize your dashboard based on your needs.
          </p>
        </div>

        <button
          onClick={onContinue}
          className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition text-lg"
        >
          Let's Get Started 🎯
        </button>
      </div>
    </div>
  );
}

// Feature Selection Phase Component
interface FeatureSelectionPhaseProps {
  selectedFeatures: string[];
  onNext: (features: string[]) => void;
  onSkip: () => void;
}

function FeatureSelectionPhase({
  selectedFeatures,
  onNext,
  onSkip,
}: FeatureSelectionPhaseProps) {
  const [features, setFeatures] = useState(selectedFeatures);

  const featureOptions = [
    { id: 'products', name: '📦 Products/Services', desc: 'Manage your product catalog' },
    { id: 'leads', name: '👥 Lead Management', desc: 'Track and manage sales leads' },
    { id: 'email', name: '📧 Email Campaigns', desc: 'Automated email marketing' },
    { id: 'automation', name: '🤖 Automation', desc: 'Trigger-based workflows' },
    { id: 'social', name: '📱 Social Media', desc: 'Manage social accounts' },
    { id: 'payments', name: '💳 Payments', desc: 'Accept online payments' },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Which features interest you?
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {featureOptions.map(({ id, name, desc }) => (
            <button
              key={id}
              onClick={() =>
                setFeatures(prev =>
                  prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
                )
              }
              className={`p-6 rounded-lg border-2 transition text-left ${
                features.includes(id)
                  ? 'bg-blue-600 border-blue-400'
                  : 'bg-slate-700 border-slate-600 hover:border-slate-500'
              }`}
            >
              <p className="text-xl font-semibold text-white mb-2">{name}</p>
              <p className="text-sm text-gray-300">{desc}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => onNext(features)}
            disabled={features.length === 0}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition"
          >
            Continue with {features.length} feature{features.length !== 1 ? 's' : ''}
          </button>
          <button
            onClick={onSkip}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

// AI Theme Generation Phase Component
interface AIThemeGenerationPhaseProps {
  isLoading: boolean;
  error: string | null;
  businessType?: string;
  businessName?: string;
}

function AIThemeGenerationPhase({
  isLoading,
  error,
  businessType,
  businessName,
}: AIThemeGenerationPhaseProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {isLoading ? (
          <>
            <div className="mb-8">
              <Loader className="animate-spin mx-auto mb-6" size={64} />
              <h1 className="text-3xl font-bold text-white mb-4">
                🎨 Creating Your Custom Theme
              </h1>
              <p className="text-gray-300 mb-4">
                AI is analyzing your {businessType} business to generate the perfect color scheme...
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ Analyzing business type & industry</p>
                <p>✓ Considering selected features</p>
                <p>✓ Generating color palette</p>
                <p>✓ Optimizing for brand personality</p>
              </div>
            </div>
          </>
        ) : error ? (
          <>
            <AlertCircle className="mx-auto mb-6 text-red-400" size={64} />
            <h1 className="text-3xl font-bold text-white mb-4">Theme Generation Error</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <p className="text-sm text-gray-400">
              Don't worry! We'll show you a default theme instead.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

// Completion Phase Component
interface CompletionPhaseProps {
  businessName?: string;
  onContinue: () => void;
}

function CompletionPhase({ businessName, onContinue }: CompletionPhaseProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <CheckCircle className="mx-auto mb-6 text-green-400" size={80} />
        <h1 className="text-4xl font-bold text-white mb-4">
          🎉 You're All Set!
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your Redeem Rocket platform is ready to go, {businessName}!
        </p>

        <div className="bg-slate-700/50 rounded-lg p-6 mb-8 border border-slate-600">
          <p className="text-gray-300 mb-4">Your platform includes:</p>
          <ul className="text-left space-y-2 text-gray-400">
            <li>✅ Personalized AI-generated theme</li>
            <li>✅ Selected features ready to use</li>
            <li>✅ Automated workflows</li>
            <li>✅ AI insights and recommendations</li>
          </ul>
        </div>

        <button
          onClick={onContinue}
          className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition text-lg"
        >
          Enter Dashboard 🚀
        </button>
      </div>
    </div>
  );
}

export default OnboardingOrchestrator;
