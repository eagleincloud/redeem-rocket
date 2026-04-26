import React, { useState, useCallback, useMemo } from 'react';
import { AlertCircle, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import CategorySelector from './CategorySelector';
import BusinessTypeSelector from './BusinessTypeSelector';
import TemplateSelector from './TemplateSelector';
import TemplatePreview from './TemplatePreview';

export type OnboardingStep = 'category' | 'type' | 'template' | 'preview' | 'complete';

export interface OnboardingData {
  category: string;
  type: string;
  template: string;
  templateName?: string;
}

export interface CategoryOnboardingProps {
  onComplete: (data: OnboardingData) => void;
  onCancel?: () => void;
}

interface ErrorState {
  message: string;
  field?: string;
}

interface StepConfig {
  title: string;
  description: string;
  order: number;
}

const STEP_CONFIG: Record<OnboardingStep, StepConfig> = {
  category: {
    title: 'Select Category',
    description: 'Choose your business category',
    order: 1,
  },
  type: {
    title: 'Business Type',
    description: 'Define your business type',
    order: 2,
  },
  template: {
    title: 'Choose Template',
    description: 'Select a workflow template',
    order: 3,
  },
  preview: {
    title: 'Preview Template',
    description: 'Review before applying',
    order: 4,
  },
  complete: {
    title: 'Complete',
    description: 'Setup in progress',
    order: 5,
  },
};

const TOTAL_STEPS = 4;

const CategoryOnboarding: React.FC<CategoryOnboardingProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('category');
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [error, setError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate progress
  const stepOrder = STEP_CONFIG[currentStep].order;
  const progressPercent = useMemo(() => {
    if (currentStep === 'complete') return 100;
    return (stepOrder / TOTAL_STEPS) * 100;
  }, [currentStep]);

  // Clear error when step changes
  const handleStepChange = useCallback((step: OnboardingStep) => {
    setError(null);
    setCurrentStep(step);
  }, []);

  const handleCategorySelect = useCallback((category: string) => {
    setData(prev => ({ ...prev, category }));
    handleStepChange('type');
  }, [handleStepChange]);

  const handleTypeSelect = useCallback((type: string) => {
    setData(prev => ({ ...prev, type }));
    handleStepChange('template');
  }, [handleStepChange]);

  const handleTemplateSelect = useCallback((template: string, templateName: string) => {
    setData(prev => ({ ...prev, template, templateName }));
    handleStepChange('preview');
  }, [handleStepChange]);

  const handlePreviewComplete = useCallback(async (previewData: any) => {
    try {
      setError(null);
      setIsLoading(true);

      // Simulate API delay for workspace configuration
      await new Promise(resolve => setTimeout(resolve, 1500));

      handleStepChange('complete');

      // After showing complete screen, call onComplete
      setTimeout(() => {
        if (data.category && data.type && data.template) {
          onComplete({
            category: data.category,
            type: data.type,
            template: data.template,
            templateName: data.templateName,
          });
        }
      }, 2000);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to apply template',
        field: 'template',
      });
    } finally {
      setIsLoading(false);
    }
  }, [data, onComplete, handleStepChange]);

  const handleBack = useCallback(() => {
    const steps: OnboardingStep[] = ['category', 'type', 'template', 'preview', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      handleStepChange(steps[currentIndex - 1]);
    }
  }, [currentStep, handleStepChange]);

  const canGoBack = currentStep !== 'category' && currentStep !== 'complete';

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'category':
        return (
          <CategorySelector
            onSelect={handleCategorySelect}
            loading={isLoading}
          />
        );

      case 'type':
        return (
          <BusinessTypeSelector
            category={data.category || ''}
            onSelect={handleTypeSelect}
            onBack={handleBack}
            loading={isLoading}
          />
        );

      case 'template':
        return (
          <TemplateSelector
            category={data.category || ''}
            type={data.type || ''}
            onSelect={handleTemplateSelect}
            onBack={handleBack}
            loading={isLoading}
          />
        );

      case 'preview':
        return (
          <TemplatePreview
            category={data.category || ''}
            type={data.type || ''}
            template={data.template || ''}
            templateName={data.templateName || ''}
            onComplete={handlePreviewComplete}
            onBack={handleBack}
            loading={isLoading}
          />
        );

      case 'complete':
        return (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Setup Complete!
            </h2>
            <p className="text-slate-400 text-center max-w-md mb-8">
              Your workspace is being configured with the selected template and features.
            </p>
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />
              <span className="text-slate-300">Configuring your workspace</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-50 bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          {/* Step Counter and Title */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {STEP_CONFIG[currentStep].title}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {STEP_CONFIG[currentStep].description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-300">
                Step {stepOrder} of {TOTAL_STEPS}
              </p>
              <p className="text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {Math.round(progressPercent)}%
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            {(['category', 'type', 'template', 'preview'] as OnboardingStep[]).map(
              (step, index) => {
                const isActive = currentStep === step;
                const isCompleted = STEP_CONFIG[step].order < stepOrder;
                const isAccessible = STEP_CONFIG[step].order <= stepOrder;

                return (
                  <div key={step} className="flex items-center gap-2 min-w-max">
                    <button
                      onClick={() => isAccessible && handleStepChange(step)}
                      disabled={!isAccessible}
                      className={`flex items-center justify-center h-10 w-10 rounded-full font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                      } ${isAccessible && !isActive ? 'cursor-pointer hover:bg-slate-600' : ''}`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </button>
                    {index < 3 && (
                      <ChevronRight
                        className={`h-4 w-4 ${
                          isCompleted ? 'text-green-500' : 'text-slate-600'
                        }`}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-400">Error</p>
              <p className="text-sm text-red-300 mt-1">{error.message}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 min-h-96">
          {renderStepContent()}
        </div>

        {/* Navigation Footer */}
        {currentStep !== 'complete' && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
            <button
              onClick={handleBack}
              disabled={!canGoBack || isLoading}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                canGoBack && !isLoading
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              Back
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-6 py-2 rounded-lg font-medium text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-all duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryOnboarding;
