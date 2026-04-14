import { useState, useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface GuideStep {
  title: string;
  description: string;
  highlight?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface FeatureGuideOverlayProps {
  steps: GuideStep[];
  featureName: string;
  onComplete?: () => void;
}

export function FeatureGuideOverlay({
  steps,
  featureName,
  onComplete,
}: FeatureGuideOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (currentStep < steps.length && steps[currentStep].highlight) {
      const element = document.querySelector(`[data-guide="${steps[currentStep].highlight}"]`);
      setHighlightElement(element as HTMLElement);
    }
  }, [currentStep, steps]);

  if (!isVisible || currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setIsVisible(false);
      onComplete?.();
      // Mark that user completed this guide
      sessionStorage.setItem(`guide_completed_${featureName}`, 'true');
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    sessionStorage.setItem(`guide_skipped_${featureName}`, 'true');
  };

  return (
    <>
      {/* Overlay backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          pointerEvents: highlightElement ? 'auto' : 'none',
        }}
        onClick={highlightElement ? undefined : handleSkip}
      />

      {/* Highlight box around element */}
      {highlightElement && (
        <div
          style={{
            position: 'fixed',
            zIndex: 9999,
            border: '3px solid #3b82f6',
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            ...(() => {
              const rect = highlightElement.getBoundingClientRect();
              return {
                top: `${rect.top - 4}px`,
                left: `${rect.left - 4}px`,
                width: `${rect.width + 8}px`,
                height: `${rect.height + 8}px`,
              };
            })(),
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={{
          position: 'fixed',
          zIndex: 10000,
          background: '#1e293b',
          color: '#fff',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '400px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          ...(highlightElement
            ? (() => {
                const rect = highlightElement.getBoundingClientRect();
                const position = step.position || 'bottom';
                const spacing = 20;

                switch (position) {
                  case 'top':
                    return {
                      bottom: `${window.innerHeight - rect.top + spacing}px`,
                      left: `${rect.left + rect.width / 2 - 200}px`,
                    };
                  case 'left':
                    return {
                      right: `${window.innerWidth - rect.left + spacing}px`,
                      top: `${rect.top + rect.height / 2 - 60}px`,
                    };
                  case 'right':
                    return {
                      left: `${rect.right + spacing}px`,
                      top: `${rect.top + rect.height / 2 - 60}px`,
                    };
                  default: // bottom
                    return {
                      top: `${rect.bottom + spacing}px`,
                      left: `${rect.left + rect.width / 2 - 200}px`,
                    };
                }
              })()
            : {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }),
        }}
      >
        {/* Progress indicator */}
        <div
          style={{
            fontSize: '12px',
            color: '#94a3b8',
            marginBottom: '8px',
          }}
        >
          Step {currentStep + 1} of {steps.length}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#fff',
          }}
        >
          {step.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '14px',
            color: '#cbd5e1',
            marginBottom: '16px',
            lineHeight: '1.5',
          }}
        >
          {step.description}
        </p>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handleSkip}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              color: '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            {isLastStep ? 'Done' : 'Skip'}
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#3b82f6')}
          >
            {isLastStep ? 'Finish' : 'Next'}
            {!isLastStep && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </>
  );
}

// Hook to manage guide display
export function useFeatureGuide(featureName: string) {
  const [shouldShow, setShouldShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    const completed = sessionStorage.getItem(`guide_completed_${featureName}`);
    const skipped = sessionStorage.getItem(`guide_skipped_${featureName}`);
    const timesShown = parseInt(sessionStorage.getItem(`guide_shown_${featureName}`) || '0', 10);
    // Show once per session, max 2 times
    return !completed && !skipped && timesShown < 2;
  });

  const markShown = () => {
    const timesShown = parseInt(sessionStorage.getItem(`guide_shown_${featureName}`) || '0', 10);
    sessionStorage.setItem(`guide_shown_${featureName}`, String(timesShown + 1));
  };

  const resetGuide = () => {
    sessionStorage.removeItem(`guide_completed_${featureName}`);
    sessionStorage.removeItem(`guide_skipped_${featureName}`);
    sessionStorage.removeItem(`guide_shown_${featureName}`);
    setShouldShow(true);
  };

  useEffect(() => {
    if (shouldShow) {
      markShown();
    }
  }, [shouldShow]);

  return { shouldShow, resetGuide };
}
