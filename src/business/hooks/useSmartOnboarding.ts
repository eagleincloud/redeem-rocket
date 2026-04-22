import { useState, useCallback } from 'react';

/**
 * Type definition for onboarding phases
 */
export type OnboardingPhase = 'discovery' | 'showcase' | 'theme' | 'journey' | 'setup' | 'preview';

/**
 * Theme preference configuration
 */
export interface ThemePreference {
  layout: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  fontStyle: string;
}

/**
 * Complete onboarding state interface
 */
export interface OnboardingState {
  featurePreferences: Record<string, boolean>;
  featuredFeatures: string[];
  themePreference: ThemePreference;
  selectedPipelineTemplates: string[];
  journeyAnswers: Record<string, any>;
  generatedPipelines: any[];
  generatedAutomations: any[];
  currentPhase: OnboardingPhase;
  isLoading: boolean;
  error: string | null;
}

/**
 * Default initial state for onboarding
 */
const DEFAULT_STATE: OnboardingState = {
  featurePreferences: {
    product_catalog: false,
    lead_management: false,
    email_campaigns: false,
    automation: false,
    social_media: false,
  },
  featuredFeatures: [],
  themePreference: {
    layout: 'default',
    primaryColor: '#ff4400',
    secondaryColor: '#1f2937',
    logoUrl: null,
    fontStyle: 'inter',
  },
  selectedPipelineTemplates: [],
  journeyAnswers: {},
  generatedPipelines: [],
  generatedAutomations: [],
  currentPhase: 'discovery',
  isLoading: false,
  error: null,
};

/**
 * Phase progression order
 */
const PHASE_ORDER: OnboardingPhase[] = [
  'discovery',
  'showcase',
  'theme',
  'journey',
  'setup',
  'preview',
];

/**
 * useSmartOnboarding
 *
 * Comprehensive custom hook for Smart Onboarding state management with full
 * state control, phase navigation, validation logic, and API integrations.
 *
 * @param userId - Optional user ID for localStorage persistence
 * @returns Object containing state, update methods, navigation methods, and utilities
 *
 * @example
 * const {
 *   state,
 *   updateFeaturePreferences,
 *   goNext,
 *   canProceed,
 *   getPhaseProgress,
 * } = useSmartOnboarding('user-123');
 */
export function useSmartOnboarding(userId?: string) {
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);

  const storageKey = userId ? `smart_onboarding_${userId}` : 'smart_onboarding';

  /**
   * Persist state to localStorage
   */
  const persistState = useCallback((newState: OnboardingState) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newState));
    } catch (err) {
      console.warn('[useSmartOnboarding] Failed to persist state to localStorage:', err);
    }
  }, [storageKey]);

  /**
   * Update feature preferences
   *
   * @param prefs - Record of feature preferences to update
   * @example
   * updateFeaturePreferences({
   *   product_catalog: true,
   *   lead_management: true,
   * })
   */
  const updateFeaturePreferences = useCallback((prefs: Record<string, boolean>) => {
    setState(prev => {
      const newState = {
        ...prev,
        featurePreferences: { ...prev.featurePreferences, ...prefs },
        error: null,
      };
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  /**
   * Update theme preference settings
   *
   * @param theme - Partial theme preference object to merge
   * @example
   * updateThemePreference({
   *   primaryColor: '#ff0000',
   *   logoUrl: 'https://example.com/logo.png',
   * })
   */
  const updateThemePreference = useCallback((theme: Partial<ThemePreference>) => {
    setState(prev => {
      const newState = {
        ...prev,
        themePreference: { ...prev.themePreference, ...theme },
        error: null,
      };
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  /**
   * Update selected pipeline templates
   *
   * @param pipelines - Array of pipeline template IDs to select
   * @example
   * updateSelectedPipelines(['sales-pipeline', 'customer-journey'])
   */
  const updateSelectedPipelines = useCallback((pipelines: string[]) => {
    setState(prev => {
      const newState = {
        ...prev,
        selectedPipelineTemplates: pipelines,
        error: null,
      };
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  /**
   * Update journey answers from customer journey questionnaire
   *
   * @param answers - Record of question IDs to answers
   * @example
   * updateJourneyAnswers({
   *   'q1': 'answer1',
   *   'q2': { multiSelect: ['option1', 'option2'] },
   * })
   */
  const updateJourneyAnswers = useCallback((answers: Record<string, any>) => {
    setState(prev => {
      const newState = {
        ...prev,
        journeyAnswers: { ...prev.journeyAnswers, ...answers },
        error: null,
      };
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  /**
   * Set generated pipelines from AI setup
   *
   * @param pipelines - Array of generated pipeline configurations
   * @example
   * setGeneratedPipelines([{ id: 'p1', name: 'Sales', stages: [...] }])
   */
  const setGeneratedPipelines = useCallback((pipelines: any[]) => {
    setState(prev => {
      const newState = {
        ...prev,
        generatedPipelines: pipelines,
        error: null,
      };
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  /**
   * Set generated automations from AI setup
   *
   * @param automations - Array of generated automation configurations
   * @example
   * setGeneratedAutomations([{ id: 'a1', name: 'Welcome Email', trigger: 'new_lead' }])
   */
  const setGeneratedAutomations = useCallback((automations: any[]) => {
    setState(prev => {
      const newState = {
        ...prev,
        generatedAutomations: automations,
        error: null,
      };
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  /**
   * Set featured features (curated list of key features for this business)
   *
   * @param features - Array of feature names to highlight
   * @example
   * setFeaturedFeatures(['product_catalog', 'lead_management'])
   */
  const setFeaturedFeatures = useCallback((features: string[]) => {
    setState(prev => {
      const newState = {
        ...prev,
        featuredFeatures: features,
        error: null,
      };
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  /**
   * Set the current onboarding phase
   *
   * @param phase - The phase to transition to
   * @example
   * setCurrentPhase('theme')
   */
  const setCurrentPhase = useCallback((phase: OnboardingPhase) => {
    setState(prev => {
      const newState = {
        ...prev,
        currentPhase: phase,
        error: null,
      };
      persistState(newState);
      return newState;
    });
  }, [persistState]);

  /**
   * Set loading state
   *
   * @param loading - Boolean indicating if an async operation is in progress
   */
  const setIsLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  /**
   * Set error state with a meaningful error message
   *
   * @param error - Error message or null to clear
   */
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  /**
   * Validate the discovery phase
   * Requires at least one feature selected
   *
   * @returns True if phase is valid, false otherwise
   */
  const validateDiscoveryPhase = useCallback((): boolean => {
    const selectedCount = Object.values(state.featurePreferences).filter(Boolean).length;
    if (selectedCount === 0) {
      setError('Please select at least one feature to continue');
      return false;
    }
    return true;
  }, [state.featurePreferences, setError]);

  /**
   * Validate the showcase phase
   * Requires at least one pipeline template selected (handled in theme phase)
   *
   * @returns True if phase is valid, false otherwise
   */
  const validateShowcasePhase = useCallback((): boolean => {
    // Showcase phase primarily prepares featured features
    // Validation happens if featured features should be required
    return true;
  }, []);

  /**
   * Validate the theme phase
   * Requires at least one pipeline template selected
   *
   * @returns True if phase is valid, false otherwise
   */
  const validateThemePhase = useCallback((): boolean => {
    if (state.selectedPipelineTemplates.length === 0) {
      setError('Please select at least one pipeline template to continue');
      return false;
    }
    return true;
  }, [state.selectedPipelineTemplates, setError]);

  /**
   * Validate the journey phase
   * Requires all required questions to be answered
   *
   * @returns True if phase is valid, false otherwise
   */
  const validateJourneyPhase = useCallback((): boolean => {
    // Check if critical journey questions are answered
    if (Object.keys(state.journeyAnswers).length === 0) {
      setError('Please answer the journey questions to continue');
      return false;
    }
    return true;
  }, [state.journeyAnswers, setError]);

  /**
   * Validate the setup phase (generated pipelines/automations exist)
   *
   * @returns True if phase is valid, false otherwise
   */
  const validateSetupPhase = useCallback((): boolean => {
    if (state.generatedPipelines.length === 0) {
      setError('Generated pipelines are not ready. Please regenerate.');
      return false;
    }
    return true;
  }, [state.generatedPipelines, setError]);

  /**
   * Validate the preview phase (all setup complete)
   *
   * @returns True if phase is valid, false otherwise
   */
  const validatePreviewPhase = useCallback((): boolean => {
    return true; // Preview phase always valid - just display review
  }, []);

  /**
   * Validate if the current phase can proceed to the next
   * Runs appropriate validation based on current phase
   *
   * @returns True if current phase is valid and can proceed, false otherwise
   */
  const canProceed = useCallback((): boolean => {
    switch (state.currentPhase) {
      case 'discovery':
        return validateDiscoveryPhase();
      case 'showcase':
        return validateShowcasePhase();
      case 'theme':
        return validateThemePhase();
      case 'journey':
        return validateJourneyPhase();
      case 'setup':
        return validateSetupPhase();
      case 'preview':
        return validatePreviewPhase();
      default:
        return false;
    }
  }, [
    state.currentPhase,
    validateDiscoveryPhase,
    validateShowcasePhase,
    validateThemePhase,
    validateJourneyPhase,
    validateSetupPhase,
    validatePreviewPhase,
  ]);

  /**
   * Move to the next phase
   * Validates current phase before proceeding
   *
   * @returns True if successfully moved to next phase, false otherwise
   */
  const goNext = useCallback((): boolean => {
    if (!canProceed()) {
      return false;
    }

    const currentIndex = PHASE_ORDER.indexOf(state.currentPhase);
    if (currentIndex < PHASE_ORDER.length - 1) {
      const nextPhase = PHASE_ORDER[currentIndex + 1];
      setCurrentPhase(nextPhase);
      return true;
    }

    return false; // Already at last phase
  }, [state.currentPhase, canProceed, setCurrentPhase]);

  /**
   * Move to the previous phase
   *
   * @returns True if successfully moved to previous phase, false otherwise
   */
  const goBack = useCallback((): boolean => {
    const currentIndex = PHASE_ORDER.indexOf(state.currentPhase);
    if (currentIndex > 0) {
      const prevPhase = PHASE_ORDER[currentIndex - 1];
      setCurrentPhase(prevPhase);
      setError(null); // Clear error when going back
      return true;
    }

    return false; // Already at first phase
  }, [state.currentPhase, setCurrentPhase, setError]);

  /**
   * Get progress percentage for current phase in onboarding journey
   *
   * @returns Number between 0 and 100 representing progress
   */
  const getPhaseProgress = useCallback((): number => {
    const currentIndex = PHASE_ORDER.indexOf(state.currentPhase);
    return Math.round(((currentIndex + 1) / PHASE_ORDER.length) * 100);
  }, [state.currentPhase]);

  /**
   * Get count of selected features
   *
   * @returns Number of features with true preference
   */
  const getSelectedFeatureCount = useCallback((): number => {
    return Object.values(state.featurePreferences).filter(Boolean).length;
  }, [state.featurePreferences]);

  /**
   * Check if there are any errors in current state
   *
   * @returns True if error is set, false otherwise
   */
  const hasErrors = useCallback((): boolean => {
    return state.error !== null;
  }, [state.error]);

  /**
   * Reset all onboarding state to defaults
   * Clears localStorage and all state values
   */
  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.warn('[useSmartOnboarding] Failed to clear localStorage:', err);
    }
  }, [storageKey]);

  /**
   * Generate smart setup using AI (pipelines and automations)
   * Calls backend API to generate customized setup based on business info
   *
   * @param businessType - Type of business (e.g., 'ecommerce', 'services')
   * @param businessName - Name of the business
   * @returns Promise resolving to true on success, false on failure
   *
   * @example
   * const success = await generateSmartSetup('services', 'My Agency');
   * if (success) {
   *   console.log('Pipelines:', state.generatedPipelines);
   *   console.log('Automations:', state.generatedAutomations);
   * }
   */
  const generateSmartSetup = useCallback(
    async (businessType: string, businessName: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // Call the onboarding AI API endpoint
        // This would be implemented based on your backend
        const response = await fetch('/api/smart-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessType,
            businessName,
            selectedFeatures: Object.keys(state.featurePreferences).filter(
              key => state.featurePreferences[key]
            ),
            selectedTemplates: state.selectedPipelineTemplates,
            journeyAnswers: state.journeyAnswers,
            themePreference: state.themePreference,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Validate response structure
        if (!data.pipelines || !Array.isArray(data.pipelines)) {
          throw new Error('Invalid pipelines format from API');
        }
        if (!data.automations || !Array.isArray(data.automations)) {
          throw new Error('Invalid automations format from API');
        }

        // Update state with generated data
        setGeneratedPipelines(data.pipelines);
        setGeneratedAutomations(data.automations);

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate smart setup';
        setError(errorMessage);
        console.error('[useSmartOnboarding] generateSmartSetup error:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [state.featurePreferences, state.selectedPipelineTemplates, state.journeyAnswers, state.themePreference, setGeneratedPipelines, setGeneratedAutomations, setIsLoading, setError]
  );

  /**
   * Save onboarding completion to database
   * Persists all onboarding data and marks onboarding as complete
   *
   * @param userId - User ID to save onboarding for
   * @returns Promise resolving to true on success, false on failure
   *
   * @example
   * const saved = await saveOnboarding('user-123');
   * if (saved) {
   *   navigate('/app/dashboard');
   * }
   */
  const saveOnboarding = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!userId) {
        setError('User ID is required to save onboarding');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use the completeOnboarding function from supabase-data
        const result = await fetch('/api/complete-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            featurePreferences: state.featurePreferences,
            themePreference: state.themePreference,
            selectedPipelineTemplates: state.selectedPipelineTemplates,
            journeyAnswers: state.journeyAnswers,
            generatedPipelines: state.generatedPipelines,
            generatedAutomations: state.generatedAutomations,
          }),
        });

        if (!result.ok) {
          const errorData = await result.json().catch(() => ({}));
          throw new Error(errorData.message || `Save failed: ${result.statusText}`);
        }

        // Clear localStorage after successful save
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // Ignore cleanup errors
        }

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save onboarding data';
        setError(errorMessage);
        console.error('[useSmartOnboarding] saveOnboarding error:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [state, storageKey, setIsLoading, setError]
  );

  /**
   * Restore saved state from localStorage
   * Useful for resuming incomplete onboarding
   */
  const restoreFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const restoredState = JSON.parse(saved) as OnboardingState;
        setState(restoredState);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[useSmartOnboarding] Failed to restore state from storage:', err);
      return false;
    }
  }, [storageKey]);

  return {
    // State
    state,

    // Update methods
    updateFeaturePreferences,
    updateThemePreference,
    updateSelectedPipelines,
    updateJourneyAnswers,
    setGeneratedPipelines,
    setGeneratedAutomations,
    setFeaturedFeatures,
    setCurrentPhase,
    setIsLoading,
    setError,

    // Navigation methods
    goNext,
    goBack,

    // Validation methods
    validateDiscoveryPhase,
    validateShowcasePhase,
    validateThemePhase,
    validateJourneyPhase,
    validateSetupPhase,
    validatePreviewPhase,
    canProceed,

    // Getter methods
    getPhaseProgress,
    getSelectedFeatureCount,
    hasErrors,

    // Utility methods
    reset,
    restoreFromStorage,

    // API methods
    generateSmartSetup,
    saveOnboarding,
  };
}
