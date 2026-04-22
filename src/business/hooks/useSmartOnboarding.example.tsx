/**
 * useSmartOnboarding Hook - Usage Examples
 *
 * This file demonstrates comprehensive usage patterns for the useSmartOnboarding hook
 * in various component scenarios during the Smart Onboarding flow.
 */

import { useSmartOnboarding, OnboardingPhase } from './useSmartOnboarding';
import { useEffect } from 'react';

/**
 * EXAMPLE 1: Basic Initialization and Feature Selection
 *
 * Shows how to initialize the hook and manage feature preferences
 */
export function DiscoveryPhaseExample() {
  const { state, updateFeaturePreferences, goNext, canProceed, setError } = useSmartOnboarding('user-123');

  const handleFeatureToggle = (feature: string, selected: boolean) => {
    updateFeaturePreferences({
      [feature]: selected,
    });
  };

  const handleContinue = () => {
    // canProceed validates that at least one feature is selected
    if (canProceed()) {
      goNext(); // Moves from 'discovery' to 'showcase'
    }
  };

  const selectedCount = Object.values(state.featurePreferences).filter(Boolean).length;

  return (
    <div>
      <h2>Discovery Phase - Select Features</h2>
      <p>Selected: {selectedCount} features</p>

      {Object.entries(state.featurePreferences).map(([key, value]) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleFeatureToggle(key, e.target.checked)}
          />
          {key.replace(/_/g, ' ')}
        </label>
      ))}

      {state.error && <div className="error">{state.error}</div>}

      <button onClick={handleContinue}>Continue</button>
    </div>
  );
}

/**
 * EXAMPLE 2: Theme Customization with Validation
 *
 * Shows how to update theme preferences and validate before proceeding
 */
export function ThemePhaseExample() {
  const {
    state,
    updateThemePreference,
    updateSelectedPipelines,
    goNext,
    goBack,
    canProceed,
    getPhaseProgress,
  } = useSmartOnboarding('user-123');

  const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor', color: string) => {
    updateThemePreference({
      [colorType]: color,
    });
  };

  const handleTemplateSelect = (templateId: string, selected: boolean) => {
    if (selected) {
      updateSelectedPipelines([...state.selectedPipelineTemplates, templateId]);
    } else {
      updateSelectedPipelines(state.selectedPipelineTemplates.filter(id => id !== templateId));
    }
  };

  const progress = getPhaseProgress();

  return (
    <div>
      <h2>Customize Theme & Pipelines</h2>
      <div className="progress-bar" style={{ width: `${progress}%` }} />

      <div className="theme-section">
        <label>
          Primary Color:
          <input
            type="color"
            value={state.themePreference.primaryColor}
            onChange={(e) => handleColorChange('primaryColor', e.target.value)}
          />
        </label>

        <label>
          Secondary Color:
          <input
            type="color"
            value={state.themePreference.secondaryColor}
            onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
          />
        </label>
      </div>

      <div className="templates-section">
        <h3>Select Pipeline Templates</h3>
        {['sales-pipeline', 'customer-journey', 'support-flow'].map(templateId => (
          <label key={templateId}>
            <input
              type="checkbox"
              checked={state.selectedPipelineTemplates.includes(templateId)}
              onChange={(e) => handleTemplateSelect(templateId, e.target.checked)}
            />
            {templateId}
          </label>
        ))}
      </div>

      <div className="actions">
        <button onClick={goBack}>Back</button>
        <button onClick={goNext} disabled={!canProceed()}>
          Continue
        </button>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 3: Journey Questionnaire with Answer Tracking
 *
 * Shows how to handle complex journey questions and answer persistence
 */
export function JourneyPhaseExample() {
  const {
    state,
    updateJourneyAnswers,
    goNext,
    goBack,
    canProceed,
    getPhaseProgress,
  } = useSmartOnboarding('user-123');

  const journeyQuestions = [
    {
      id: 'business-size',
      question: 'How many people are in your team?',
      type: 'select',
      options: ['1-5', '6-20', '21-50', '50+'],
    },
    {
      id: 'revenue-range',
      question: 'What is your annual revenue range?',
      type: 'select',
      options: ['<$100k', '$100k-$500k', '$500k-$1M', '$1M+'],
    },
    {
      id: 'main-challenge',
      question: 'What is your main business challenge?',
      type: 'text',
    },
  ];

  const handleAnswerChange = (questionId: string, answer: any) => {
    updateJourneyAnswers({
      [questionId]: answer,
    });
  };

  const progress = getPhaseProgress();
  const answeredCount = Object.keys(state.journeyAnswers).length;

  return (
    <div>
      <h2>Customer Journey Setup</h2>
      <div className="progress">
        Progress: {answeredCount}/{journeyQuestions.length}
      </div>

      {journeyQuestions.map(question => (
        <div key={question.id} className="question">
          <label>{question.question}</label>

          {question.type === 'select' && (
            <select
              value={state.journeyAnswers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            >
              <option value="">Select an option...</option>
              {question.options.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          {question.type === 'text' && (
            <textarea
              value={state.journeyAnswers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your response..."
            />
          )}
        </div>
      ))}

      {state.error && <div className="error">{state.error}</div>}

      <div className="actions">
        <button onClick={goBack}>Back</button>
        <button onClick={goNext} disabled={!canProceed()}>
          Generate Setup
        </button>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 4: AI Setup Generation with Async Loading
 *
 * Shows how to handle async API calls for generating pipelines and automations
 */
export function SetupPhaseExample() {
  const {
    state,
    generateSmartSetup,
    goNext,
    goBack,
    setIsLoading,
    setError,
    canProceed,
  } = useSmartOnboarding('user-123');

  const handleGenerateSetup = async () => {
    const success = await generateSmartSetup('ecommerce', 'My Business');
    if (success) {
      console.log('Setup generated successfully');
      console.log('Pipelines:', state.generatedPipelines);
      console.log('Automations:', state.generatedAutomations);
    }
  };

  return (
    <div>
      <h2>Generate Smart Setup</h2>

      {!state.generatedPipelines.length && (
        <div>
          <p>Click the button below to generate customized pipelines and automations</p>
          <button onClick={handleGenerateSetup} disabled={state.isLoading}>
            {state.isLoading ? 'Generating...' : 'Generate Smart Setup'}
          </button>
        </div>
      )}

      {state.generatedPipelines.length > 0 && (
        <div className="generated-content">
          <h3>Generated Pipelines ({state.generatedPipelines.length})</h3>
          <ul>
            {state.generatedPipelines.map((pipeline, idx) => (
              <li key={idx}>{pipeline.name || `Pipeline ${idx + 1}`}</li>
            ))}
          </ul>

          <h3>Generated Automations ({state.generatedAutomations.length})</h3>
          <ul>
            {state.generatedAutomations.map((automation, idx) => (
              <li key={idx}>{automation.name || `Automation ${idx + 1}`}</li>
            ))}
          </ul>
        </div>
      )}

      {state.error && <div className="error">{state.error}</div>}

      {state.isLoading && <div className="loading">Loading...</div>}

      <div className="actions">
        <button onClick={goBack}>Back</button>
        <button
          onClick={goNext}
          disabled={!canProceed() || state.isLoading}
        >
          Review Setup
        </button>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 5: Preview and Complete Onboarding
 *
 * Shows how to display a summary and save the onboarding
 */
export function PreviewPhaseExample() {
  const {
    state,
    saveOnboarding,
    goBack,
    getSelectedFeatureCount,
    getPhaseProgress,
  } = useSmartOnboarding('user-123');

  const handleCompleteOnboarding = async () => {
    const success = await saveOnboarding('user-123');
    if (success) {
      console.log('Onboarding completed successfully!');
      // Navigate to main app
    }
  };

  return (
    <div>
      <h2>Review Your Setup</h2>

      <div className="summary">
        <section>
          <h3>Selected Features ({getSelectedFeatureCount()})</h3>
          <ul>
            {Object.entries(state.featurePreferences).map(([key, value]) =>
              value ? <li key={key}>{key.replace(/_/g, ' ')}</li> : null
            )}
          </ul>
        </section>

        <section>
          <h3>Theme Configuration</h3>
          <p>Primary Color: {state.themePreference.primaryColor}</p>
          <p>Secondary Color: {state.themePreference.secondaryColor}</p>
          <p>Layout: {state.themePreference.layout}</p>
        </section>

        <section>
          <h3>Generated Pipelines ({state.generatedPipelines.length})</h3>
          <ul>
            {state.generatedPipelines.map((pipeline, idx) => (
              <li key={idx}>{pipeline.name || `Pipeline ${idx + 1}`}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Generated Automations ({state.generatedAutomations.length})</h3>
          <ul>
            {state.generatedAutomations.map((automation, idx) => (
              <li key={idx}>{automation.name || `Automation ${idx + 1}`}</li>
            ))}
          </ul>
        </section>
      </div>

      {state.error && <div className="error">{state.error}</div>}
      {state.isLoading && <div className="loading">Saving...</div>}

      <div className="actions">
        <button onClick={goBack}>Back</button>
        <button onClick={handleCompleteOnboarding} disabled={state.isLoading}>
          {state.isLoading ? 'Completing...' : 'Complete Onboarding'}
        </button>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 6: Resume Incomplete Onboarding
 *
 * Shows how to restore saved onboarding state and allow user to continue
 */
export function ResumeOnboardingExample() {
  const { state, restoreFromStorage, reset, goNext } = useSmartOnboarding('user-123');

  useEffect(() => {
    // Try to restore saved state on mount
    const restored = restoreFromStorage();
    if (restored) {
      console.log('Onboarding state restored from storage');
      console.log('Current phase:', state.currentPhase);
    }
  }, []);

  return (
    <div>
      <h2>Welcome Back!</h2>
      <p>You were on the {state.currentPhase} phase</p>

      <div className="progress">
        <h3>Progress Summary:</h3>
        <p>Selected Features: {Object.values(state.featurePreferences).filter(Boolean).length}</p>
        <p>Selected Pipelines: {state.selectedPipelineTemplates.length}</p>
        <p>Journey Answers: {Object.keys(state.journeyAnswers).length}</p>
      </div>

      <div className="actions">
        <button onClick={goNext}>Resume from {state.currentPhase}</button>
        <button onClick={reset}>Start Over</button>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 7: Full Onboarding Component with Phase Routing
 *
 * Shows complete integration with phase-based rendering
 */
export function SmartOnboardingContainer() {
  const { state, goNext, goBack, reset } = useSmartOnboarding('user-123');

  const phases = {
    discovery: <DiscoveryPhaseExample />,
    showcase: <div>Showcase Phase Component</div>,
    theme: <ThemePhaseExample />,
    journey: <JourneyPhaseExample />,
    setup: <SetupPhaseExample />,
    preview: <PreviewPhaseExample />,
  };

  return (
    <div className="onboarding-container">
      <div className="phase-indicator">
        Phase: {state.currentPhase} (Progress: {getPhaseProgress()}%)
      </div>

      <div className="phase-content">
        {phases[state.currentPhase]}
      </div>

      {state.error && (
        <div className="error-banner">
          <p>{state.error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {state.isLoading && (
        <div className="loading-overlay">
          <div className="spinner">Loading...</div>
        </div>
      )}
    </div>
  );
}
