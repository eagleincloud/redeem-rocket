import { useState } from 'react';
import { useNavigate, useSearchParams }  from 'react-router-dom';
import { useBusinessContext } from '../context/BusinessContext';
import { ChevronRight, ChevronLeft, Loader, Check } from 'lucide-react';
import { completeOnboarding } from '@/app/api/supabase-data';
import { FeatureShowcasePhase } from './onboarding/FeatureShowcasePhase';
import { ThemeSelectionPhase } from './onboarding/ThemeSelectionPhase';
import { DynamicJourneyPhase } from './onboarding/DynamicJourneyPhase';
import { DashboardPreviewPhase } from './onboarding/DashboardPreviewPhase';
import { FirstDataSetup } from './onboarding/FirstDataSetup';
import type { JourneyAnswersRecord } from '@/app/api/onboarding-questions';

export type FeaturePreference = 'product_catalog' | 'lead_management' | 'email_campaigns' | 'automation' | 'social_media';

export interface FeaturePreferences {
  product_catalog: boolean;
  lead_management: boolean;
  email_campaigns: boolean;
  automation: boolean;
  social_media: boolean;
}

const FEATURE_QUESTIONS = [
  {
    id: 'product_catalog',
    icon: '📦',
    title: 'Do you want to showcase your products or services?',
    subtitle: 'Create a digital catalog customers can browse',
    description: 'Add photos, descriptions, and pricing for products or services.',
    yesLabel: 'Yes, showcase products',
    noLabel: 'No, not needed',
  },
  {
    id: 'lead_management',
    icon: '👥',
    title: 'Do you want to capture and manage sales leads?',
    subtitle: 'Track potential customers through their journey',
    description: 'Monitor where leads come from, track deal progress, and close sales.',
    yesLabel: 'Yes, manage leads',
    noLabel: 'No, not needed',
  },
  {
    id: 'email_campaigns',
    icon: '📧',
    title: 'Do you want to send automated email campaigns?',
    subtitle: 'Keep customers engaged automatically',
    description: 'Send welcome series, follow-ups, and promotional messages without manual effort.',
    yesLabel: 'Yes, use email campaigns',
    noLabel: 'No, handle manually',
  },
  {
    id: 'automation',
    icon: '🤖',
    title: 'Do you want to automate your business workflows?',
    subtitle: 'Create if-then rules for repetitive tasks',
    description: 'Let your team focus on what matters by automating routine work.',
    yesLabel: 'Yes, automate workflows',
    noLabel: 'No, prefer manual',
  },
  {
    id: 'social_media',
    icon: '📱',
    title: 'Do you want to manage your social media?',
    subtitle: 'Post across all platforms from one place',
    description: 'Connect Instagram, Facebook, LinkedIn and manage everything together.',
    yesLabel: 'Yes, integrate social',
    noLabel: 'No, not right now',
  },
];

export function SmartOnboarding() {
  const navigate = useNavigate();
  const { bizUser, setBizUser } = useBusinessContext();
  const [searchParams] = useSearchParams();

  // Support ?onboardingPhase=N for development/testing (0-4 for Phase 1, 5 for Phase 2, 6 for Phase 3, 7 for Phase 4, 8 for Phase 5, 9 for Phase 6)
  const phaseParam = searchParams.get('onboardingPhase');
  const initialPhase = phaseParam && !isNaN(Number(phaseParam))
    ? Math.max(0, Math.min(9, Number(phaseParam)))
    : 0;

  const [stage, setStage] = useState<'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'phase_5' | 'phase_6' | 'complete'>('phase_1');
  const [questionIndex, setQuestionIndex] = useState(initialPhase % 5);

  // Determine initial stage based on phaseParam
  const determineInitialStage = () => {
    if (initialPhase <= 4) return 'phase_1';
    if (initialPhase === 5) return 'phase_2';
    if (initialPhase === 6) return 'phase_3';
    if (initialPhase === 7) return 'phase_4';
    if (initialPhase === 8) return 'phase_5';
    if (initialPhase === 9) return 'phase_6';
    return 'phase_1';
  };

  // Set initial stage if phaseParam is provided
  const [stage_internal, setStageInternal] = useState<'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'phase_5' | 'phase_6' | 'complete'>(() => {
    return determineInitialStage();
  });

  const [featurePreferences, setFeaturePreferences] = useState<FeaturePreferences>({
    product_catalog: true,
    lead_management: false,
    email_campaigns: false,
    automation: false,
    social_media: false,
  });

  // Phase 2 state
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Phase 3 state
  const [selectedTheme, setSelectedTheme] = useState<string>('minimalist');
  const [primaryColor, setPrimaryColor] = useState<string>('#ffffff');
  const [secondaryColor, setSecondaryColor] = useState<string>('#f3f4f6');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [selectedPipelines, setSelectedPipelines] = useState<string[]>([]);

  // Phase 4 state
  const [journeyAnswers, setJourneyAnswers] = useState<JourneyAnswersRecord>({});

  // Phase 5 state (Smart Setup - unused placeholder)
  const [phase5Completed, setPhase5Completed] = useState(false);

  // Phase 6 state (Dashboard Preview)
  const [dashboardCustomizations, setDashboardCustomizations] = useState<any>({});

  const [animatingOut, setAnimatingOut] = useState(false);
  const [loading, setLoading] = useState(false);

  // Use stage_internal as the real stage
  const stage = stage_internal;

  const colors = {
    bg: '#0a0e27',
    card: '#111827',
    border: '#1f2937',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#ff4400',
    success: '#10b981',
  };

  const currentQuestion = FEATURE_QUESTIONS[questionIndex];
  const totalQuestions = FEATURE_QUESTIONS.length;
  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  function handleAnswer(answer: boolean) {
    const featureId = currentQuestion.id as FeaturePreference;
    setFeaturePreferences(prev => ({ ...prev, [featureId]: answer }));

    // Move to next question or Phase 2
    if (questionIndex < totalQuestions - 1) {
      setAnimatingOut(true);
      setTimeout(() => {
        setQuestionIndex(questionIndex + 1);
        setAnimatingOut(false);
      }, 300);
    } else {
      // All Phase 1 questions done, move to Phase 2
      setAnimatingOut(true);
      setTimeout(() => {
        setStageInternal('phase_2');
        setAnimatingOut(false);
      }, 300);
    }
  }

  function goBack() {
    if (questionIndex > 0) {
      setAnimatingOut(true);
      setTimeout(() => {
        setQuestionIndex(questionIndex - 1);
        setAnimatingOut(false);
      }, 300);
    }
  }

  function goToPhase2() {
    setAnimatingOut(true);
    setTimeout(() => {
      setStageInternal('phase_2');
      setAnimatingOut(false);
    }, 300);
  }

  function goToPhase3() {
    setAnimatingOut(true);
    setTimeout(() => {
      setStageInternal('phase_3');
      setAnimatingOut(false);
    }, 300);
  }

  function goBackToPhase1() {
    setAnimatingOut(true);
    setTimeout(() => {
      setStageInternal('phase_1');
      setQuestionIndex(totalQuestions - 1);
      setAnimatingOut(false);
    }, 300);
  }

  function goBackToPhase2() {
    setAnimatingOut(true);
    setTimeout(() => {
      setStageInternal('phase_2');
      setAnimatingOut(false);
    }, 300);
  }

  function goToPhase4() {
    setAnimatingOut(true);
    setTimeout(() => {
      setStageInternal('phase_4');
      setAnimatingOut(false);
    }, 300);
  }

  function goBackToPhase3() {
    setAnimatingOut(true);
    setTimeout(() => {
      setStageInternal('phase_3');
      setAnimatingOut(false);
    }, 300);
  }

  function goToPhase5() {
    setAnimatingOut(true);
    setTimeout(() => {
      setStageInternal('phase_5');
      setAnimatingOut(false);
    }, 300);
  }

  function goBackToPhase4() {
    setAnimatingOut(true);
    setTimeout(() => {
      setStageInternal('phase_4');
      setAnimatingOut(false);
    }, 300);
  }

  function goToPhase6() {
    setAnimatingOut(true);
    setTimeout(() => {
      setStageInternal('phase_6');
      setAnimatingOut(false);
    }, 300);
  }

  function goBackToPhase5() {
    setAnimatingOut(true);
    setTimeout(() => {
      setStageInternal('phase_5');
      setAnimatingOut(false);
    }, 300);
  }

  function toggleFeature(featureId: string) {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  }

  async function finishOnboarding() {
    try {
      setLoading(true);

      if (!bizUser) {
        console.error('User not found');
        return;
      }

      // Save to Supabase
      const saved = await completeOnboarding(bizUser.id, featurePreferences);

      if (!saved) {
        console.warn('Failed to save to Supabase, continuing with local save');
      }

      // Update local state
      const updatedUser = {
        ...bizUser,
        feature_preferences: featurePreferences,
        onboarding_done: true,
      };

      setBizUser(updatedUser);
      localStorage.setItem('biz_user', JSON.stringify(updatedUser));

      setTimeout(() => {
        navigate('/app');
      }, 800);
    } catch (err) {
      console.error('Onboarding error:', err);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: colors.bg,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
        }}
      >
        {/* PHASE 1 - QUESTIONS STAGE */}
        {stage === 'phase_1' && (
          <div>
            {/* Progress Bar */}
            <div style={{ marginBottom: '48px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: colors.textMuted, fontWeight: 500 }}>
                  Question {questionIndex + 1} of {totalQuestions}
                </span>
                <span style={{ fontSize: '13px', color: colors.accent, fontWeight: 600 }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div
                style={{
                  height: '3px',
                  background: colors.border,
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: colors.accent,
                    width: `${progress}%`,
                    transition: 'width 0.3s ease-out',
                  }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div
              style={{
                opacity: animatingOut ? 0 : 1,
                transform: animatingOut ? 'translateY(20px)' : 'translateY(0)',
                transition: 'all 0.3s ease-out',
              }}
            >
              <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: '24px' }}>
                  {currentQuestion.icon}
                </div>
                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: colors.text,
                    margin: '0 0 12px 0',
                    lineHeight: '1.2',
                  }}
                >
                  {currentQuestion.title}
                </h1>
                <p
                  style={{
                    fontSize: '15px',
                    color: colors.textMuted,
                    margin: '0',
                    lineHeight: '1.5',
                  }}
                >
                  {currentQuestion.description}
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                <button
                  onClick={() => handleAnswer(false)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: 'transparent',
                    border: `1.5px solid ${colors.border}`,
                    color: colors.textMuted,
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.target as HTMLElement;
                    el.style.borderColor = colors.text;
                    el.style.color = colors.text;
                  }}
                  onMouseLeave={e => {
                    const el = e.target as HTMLElement;
                    el.style.borderColor = colors.border;
                    el.style.color = colors.textMuted;
                  }}
                >
                  {currentQuestion.noLabel}
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: colors.accent,
                    border: 'none',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.target as HTMLElement;
                    el.style.opacity = '0.9';
                  }}
                  onMouseLeave={e => {
                    const el = e.target as HTMLElement;
                    el.style.opacity = '1';
                  }}
                >
                  {currentQuestion.yesLabel}
                </button>
              </div>

              {/* Back Button */}
              {questionIndex > 0 && (
                <button
                  onClick={goBack}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: colors.textMuted,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLElement).style.color = colors.text;
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.color = colors.textMuted;
                  }}
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              )}
            </div>
          </div>
        )}

        {/* PHASE 2 - FEATURE SHOWCASE */}
        {stage === 'phase_2' && (
          <div
            style={{
              opacity: animatingOut ? 0 : 1,
              transform: animatingOut ? 'translateY(20px)' : 'translateY(0)',
              transition: 'all 0.3s ease-out',
            }}
          >
            <FeatureShowcasePhase
              onNext={goToPhase3}
              onPrevious={goBackToPhase1}
              selectedFeatures={selectedFeatures}
              onFeatureToggle={toggleFeature}
            />
          </div>
        )}

        {/* PHASE 3 - THEME SELECTION */}
        {stage === 'phase_3' && (
          <div
            style={{
              opacity: animatingOut ? 0 : 1,
              transform: animatingOut ? 'translateY(20px)' : 'translateY(0)',
              transition: 'all 0.3s ease-out',
              overflowY: 'auto',
              maxHeight: '90vh',
            }}
          >
            <ThemeSelectionPhase
              onNext={goToPhase4}
              onPrevious={goBackToPhase2}
              selectedTheme={selectedTheme}
              onThemeChange={setSelectedTheme}
              primaryColor={primaryColor}
              onPrimaryColorChange={setPrimaryColor}
              secondaryColor={secondaryColor}
              onSecondaryColorChange={setSecondaryColor}
              logoUrl={logoUrl}
              onLogoUpload={setLogoUrl}
              selectedPipelines={selectedPipelines}
              onPipelinesChange={setSelectedPipelines}
            />
          </div>
        )}

        {/* PHASE 4 - DYNAMIC JOURNEY */}
        {stage === 'phase_4' && (
          <div
            style={{
              opacity: animatingOut ? 0 : 1,
              transform: animatingOut ? 'translateY(20px)' : 'translateY(0)',
              transition: 'all 0.3s ease-out',
              overflowY: 'auto',
              maxHeight: '90vh',
            }}
          >
            <DynamicJourneyPhase
              onNext={(answers) => {
                setJourneyAnswers(answers);
                goToPhase5();
              }}
              onPrevious={goBackToPhase3}
              selectedFeatures={selectedFeatures}
              initialAnswers={journeyAnswers}
            />
          </div>
        )}

        {/* PHASE 5 - SMART SETUP (First Data Setup) */}
        {stage === 'phase_5' && (
          <div
            style={{
              opacity: animatingOut ? 0 : 1,
              transform: animatingOut ? 'translateY(20px)' : 'translateY(0)',
              transition: 'all 0.3s ease-out',
              overflowY: 'auto',
              maxHeight: '90vh',
            }}
          >
            <FirstDataSetup
              onNext={goToPhase6}
              onPrevious={goBackToPhase4}
              businessType={bizUser?.businessCategory || 'retail'}
            />
          </div>
        )}

        {/* PHASE 6 - DASHBOARD PREVIEW & CUSTOMIZE */}
        {stage === 'phase_6' && (
          <div
            style={{
              opacity: animatingOut ? 0 : 1,
              transform: animatingOut ? 'translateY(20px)' : 'translateY(0)',
              transition: 'all 0.3s ease-out',
              overflowY: 'auto',
              maxHeight: '90vh',
            }}
          >
            <DashboardPreviewPhase
              onNext={() => {
                setAnimatingOut(true);
                setTimeout(() => {
                  setStageInternal('complete');
                  setAnimatingOut(false);
                }, 300);
              }}
              onPrevious={goBackToPhase5}
              selectedFeatures={selectedFeatures}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              logoUrl={logoUrl}
              businessName={bizUser?.businessName || 'My Business'}
              businessType={bizUser?.businessCategory || 'retail'}
              selectedPipelines={selectedPipelines}
              onCustomizationsChange={setDashboardCustomizations}
            />
          </div>
        )}

        {/* COMPLETE STAGE */}
        {stage === 'complete' && (
          <div
            style={{
              textAlign: 'center',
              opacity: animatingOut ? 0 : 1,
              transition: 'opacity 0.3s ease-out',
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
                Your dashboard is ready with the features you selected.
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
                Let's go! Your personalized dashboard is loading...
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
