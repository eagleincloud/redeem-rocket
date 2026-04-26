import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams }  from 'react-router-dom';
import { useBusinessContext } from '../context/BusinessContext';
import { ChevronRight, ChevronLeft, Loader, AlertCircle } from 'lucide-react';
import { completeOnboarding, completeOnboardingFull } from '@/app/api/supabase-data';

// Import all 8 onboarding components
import CategorySelector from './onboarding/CategorySelector';
import BusinessTypeSelector from './onboarding/BusinessTypeSelector';
import TemplateSelector from './onboarding/TemplateSelector';
import TemplatePreview from './onboarding/TemplatePreview';
import DynamicQuestionForm from './onboarding/DynamicQuestionForm';
import BehaviorRecommendations from './onboarding/BehaviorRecommendations';
import TemplateAppliedSummary from './onboarding/TemplateAppliedSummary';

// Import supplementary phases
import { FeatureShowcasePhase } from './onboarding/FeatureShowcasePhase';
import { DashboardPreviewPhase } from './onboarding/DashboardPreviewPhase';

import type { JourneyAnswersRecord } from '@/app/api/onboarding-questions';
import type { OnboardingPhase, OnboardingData, FeaturePreferences } from '../types/onboarding';

export type FeaturePreference = 'product_catalog' | 'lead_management' | 'email_campaigns' | 'automation' | 'social_media';

export { FeaturePreferences };

// Phase enumeration for component rendering
type OnboardingComponentPhase =
  | 'category_selection'
  | 'type_selection'
  | 'template_selection'
  | 'template_preview'
  | 'questions'
  | 'recommendations'
  | 'summary'
  | 'feature_showcase'
  | 'dashboard_preview'
  | 'complete';

// Comprehensive onboarding state
interface SmartOnboardingState {
  selectedCategory?: string;
  selectedType?: string;
  selectedTemplate?: string;
  templateName?: string;
  questionAnswers: Record<string, unknown>;
  selectedRecommendations: string[];
  featurePreferences: FeaturePreferences;
  selectedFeatures: string[];
  dashboardCustomizations: Record<string, unknown>;
}

export function SmartOnboarding() {
  const navigate = useNavigate();
  const { bizUser, setBizUser } = useBusinessContext();
  const [searchParams] = useSearchParams();

  // Support ?onboardingPhase=N for development/testing
  const phaseParam = searchParams.get('onboardingPhase');
  const initialPhase = (phaseParam && !isNaN(Number(phaseParam)))
    ? String(phaseParam) as OnboardingComponentPhase
    : 'category_selection' as OnboardingComponentPhase;

  // Main phase state
  const [currentPhase, setCurrentPhase] = useState<OnboardingComponentPhase>(initialPhase);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comprehensive onboarding state
  const [state, setState] = useState<SmartOnboardingState>({
    questionAnswers: {},
    selectedRecommendations: [],
    selectedFeatures: [],
    dashboardCustomizations: {},
    featurePreferences: {
      product_catalog: true,
      lead_management: false,
      email_campaigns: false,
      automation: false,
      social_media: false,
    },
  });

  // Helper function to transition phases with animation
  const transitionPhase = useCallback((newPhase: OnboardingComponentPhase) => {
    setError(null);
    setAnimatingOut(true);
    setTimeout(() => {
      setCurrentPhase(newPhase);
      setAnimatingOut(false);
    }, 300);
  }, []);

  // ── Phase Handlers ────────────────────────────────────────────────────────

  const handleCategorySelect = useCallback((category: string) => {
    setState(prev => ({ ...prev, selectedCategory: category }));
    transitionPhase('type_selection');
  }, [transitionPhase]);

  const handleTypeSelect = useCallback((type: string) => {
    setState(prev => ({ ...prev, selectedType: type }));
    transitionPhase('template_selection');
  }, [transitionPhase]);

  const handleTemplateSelect = useCallback((template: string, templateName?: string) => {
    setState(prev => ({ ...prev, selectedTemplate: template, templateName }));
    transitionPhase('template_preview');
  }, [transitionPhase]);

  const handleTemplatePreview = useCallback(() => {
    transitionPhase('questions');
  }, [transitionPhase]);

  const handleQuestionsSubmit = useCallback((answers: Record<string, unknown>) => {
    setState(prev => ({ ...prev, questionAnswers: answers }));
    transitionPhase('recommendations');
  }, [transitionPhase]);

  const handleRecommendationApply = useCallback((recommendationIds: string[]) => {
    setState(prev => ({ ...prev, selectedRecommendations: recommendationIds }));
    transitionPhase('summary');
  }, [transitionPhase]);

  const handleSummaryComplete = useCallback(() => {
    transitionPhase('feature_showcase');
  }, [transitionPhase]);

  const handleFeatureShowcaseComplete = useCallback((features: string[]) => {
    setState(prev => ({ ...prev, selectedFeatures: features }));
    transitionPhase('dashboard_preview');
  }, [transitionPhase]);

  const handleDashboardCustomize = useCallback((customizations: Record<string, unknown>) => {
    setState(prev => ({ ...prev, dashboardCustomizations: customizations }));
    transitionPhase('complete');
  }, [transitionPhase]);

  // ── Completion Handler ────────────────────────────────────────────────────

  async function finishOnboarding() {
    try {
      setLoading(true);

      if (!bizUser) {
        setError('User not found');
        setLoading(false);
        return;
      }

      // Prepare comprehensive onboarding data
      const onboardingData = {
        category: state.selectedCategory,
        type: state.selectedType,
        template: state.selectedTemplate,
        templateName: state.templateName,
        answers: state.questionAnswers,
        featurePreferences: state.featurePreferences,
        selectedFeatures: state.selectedFeatures,
        dashboardCustomizations: state.dashboardCustomizations,
        recommendations: state.selectedRecommendations,
      };

      // Save comprehensive data to Supabase
      const saved = await completeOnboardingFull(bizUser.id, onboardingData);

      if (!saved) {
        console.warn('Failed to save to Supabase, continuing with local save');
      }

      // Update local state
      const updatedUser = {
        ...bizUser,
        feature_preferences: state.featurePreferences,
        onboarding_done: true,
        onboarding_completed_at: new Date().toISOString(),
      };

      setBizUser(updatedUser);
      localStorage.setItem('biz_user', JSON.stringify(updatedUser));

      // Navigate to app after brief delay
      setTimeout(() => {
        navigate('/app');
      }, 800);
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  // ── Progress Calculation ──────────────────────────────────────────────────

  const phaseOrder: Record<OnboardingComponentPhase, number> = {
    category_selection: 1,
    type_selection: 2,
    template_selection: 3,
    template_preview: 4,
    questions: 5,
    recommendations: 6,
    summary: 7,
    feature_showcase: 8,
    dashboard_preview: 9,
    complete: 10,
  };

  const currentPhaseNum = phaseOrder[currentPhase] || 1;
  const totalPhases = 10;
  const phaseProgress = (currentPhaseNum / totalPhases) * 100;

  // ── Colors ────────────────────────────────────────────────────────────────

  const colors = {
    bg: '#0a0e27',
    card: '#111827',
    border: '#1f2937',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#ff4400',
    success: '#10b981',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        background: colors.bg,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Overall Phase Progress Indicator */}
      {currentPhase !== 'complete' && (
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            marginBottom: '32px',
            paddingTop: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: colors.textMuted, fontWeight: 500 }}>
              Phase {currentPhaseNum} of {totalPhases}
            </span>
            <span style={{ fontSize: '12px', color: colors.accent, fontWeight: 600 }}>
              {Math.round(phaseProgress)}%
            </span>
          </div>
          <div
            style={{
              height: '2px',
              background: colors.border,
              borderRadius: '1px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: colors.accent,
                width: `${phaseProgress}%`,
                transition: 'width 0.3s ease-out',
              }}
            />
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            marginBottom: '20px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: `1px solid rgba(239, 68, 68, 0.3)`,
            borderRadius: '8px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ color: '#fca5a5', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          opacity: animatingOut ? 0 : 1,
          transform: animatingOut ? 'translateY(20px)' : 'translateY(0)',
          transition: 'all 0.3s ease-out',
        }}
      >
        {/* Phase: Category Selection */}
        {currentPhase === 'category_selection' && (
          <CategorySelector
            onSelect={handleCategorySelect}
            loading={loading}
          />
        )}

        {/* Phase: Type Selection */}
        {currentPhase === 'type_selection' && (
          <BusinessTypeSelector
            category={state.selectedCategory || ''}
            onSelect={handleTypeSelect}
            onBack={() => transitionPhase('category_selection')}
            loading={loading}
          />
        )}

        {/* Phase: Template Selection */}
        {currentPhase === 'template_selection' && (
          <TemplateSelector
            businessType={state.selectedType || ''}
            onSelect={handleTemplateSelect}
            onBack={() => transitionPhase('type_selection')}
            loading={loading}
          />
        )}

        {/* Phase: Template Preview */}
        {currentPhase === 'template_preview' && (
          <TemplatePreview
            template={state.selectedTemplate || ''}
            onConfirm={handleTemplatePreview}
            onBack={() => transitionPhase('template_selection')}
          />
        )}

        {/* Phase: Dynamic Questions */}
        {currentPhase === 'questions' && (
          <DynamicQuestionForm
            onSubmit={handleQuestionsSubmit}
            onBack={() => transitionPhase('template_preview')}
            initialAnswers={state.questionAnswers}
          />
        )}

        {/* Phase: Behavior Recommendations */}
        {currentPhase === 'recommendations' && (
          <BehaviorRecommendations
            onApply={handleRecommendationApply}
            onSkip={() => transitionPhase('summary')}
            category={state.selectedCategory || ''}
            businessType={state.selectedType || ''}
          />
        )}

        {/* Phase: Template Applied Summary */}
        {currentPhase === 'summary' && (
          <TemplateAppliedSummary
            templateName={state.templateName || 'Selected Template'}
            onComplete={handleSummaryComplete}
            onBack={() => transitionPhase('recommendations')}
          />
        )}

        {/* Phase: Feature Showcase */}
        {currentPhase === 'feature_showcase' && (
          <FeatureShowcasePhase
            onNext={(features) => handleFeatureShowcaseComplete(features || [])}
            onPrevious={() => transitionPhase('summary')}
            selectedFeatures={state.selectedFeatures}
            onFeatureToggle={(featureId) => {
              setState(prev => ({
                ...prev,
                selectedFeatures: prev.selectedFeatures.includes(featureId)
                  ? prev.selectedFeatures.filter(id => id !== featureId)
                  : [...prev.selectedFeatures, featureId],
              }));
            }}
          />
        )}

        {/* Phase: Dashboard Preview */}
        {currentPhase === 'dashboard_preview' && (
          <DashboardPreviewPhase
            onNext={() => {
              setAnimatingOut(true);
              setTimeout(() => {
                setCurrentPhase('complete');
                setAnimatingOut(false);
              }, 300);
            }}
            onPrevious={() => transitionPhase('feature_showcase')}
            selectedFeatures={state.selectedFeatures}
            businessName={bizUser?.businessName || 'My Business'}
            businessType={bizUser?.businessCategory || 'retail'}
            selectedPipelines={[]}
            onCustomizationsChange={handleDashboardCustomize}
          />
        )}

        {/* Phase: Complete */}
        {currentPhase === 'complete' && (
          <div
            style={{
              textAlign: 'center',
              marginBottom: '40px',
            }}
          >
            <div style={{ marginBottom: '40px' }}>
              <div style={{ fontSize: '56px', marginBottom: '24px' }}>✨</div>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: colors.text,
                  margin: '0 0 12px 0',
                }}
              >
                You're all set!
              </h1>
              <p
                style={{
                  fontSize: '15px',
                  color: colors.textMuted,
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                Your dashboard is ready with the {state.selectedTemplate} template and selected features.
              </p>
            </div>

            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '28px 24px',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚀</div>
              <p
                style={{
                  color: colors.textMuted,
                  fontSize: '14px',
                  margin: 0,
                  lineHeight: '1.6',
                }}
              >
                {loading ? 'Finalizing your setup...' : 'Ready to launch your business dashboard'}
              </p>
            </div>

            <button
              onClick={finishOnboarding}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: colors.accent,
                border: 'none',
                color: 'white',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Finishing...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
