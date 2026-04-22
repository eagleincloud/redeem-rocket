import { useMemo } from 'react';
import { useBusinessContext } from '../context/BusinessContext';
import {
  isNavItemEnabled,
  filterNavItemsByFeatures,
  getEnabledFeatures,
  getFeatureForPath,
  shouldShowNavGroup,
} from '../utils/featureNav';

/**
 * Hook for feature-based navigation filtering.
 * Provides utilities to check if nav items should be shown based on enabled features.
 */
export function useFeatureNav() {
  const { bizUser } = useBusinessContext();

  const featurePreferences = bizUser?.feature_preferences as Record<string, boolean> | undefined;

  return useMemo(() => ({
    /**
     * Check if a specific nav path should be enabled
     */
    isEnabled: (path: string) =>
      isNavItemEnabled(path, featurePreferences),

    /**
     * Filter an array of nav items
     */
    filterItems: (items: Array<{ path: string; [key: string]: unknown }>) =>
      filterNavItemsByFeatures(items, featurePreferences),

    /**
     * Check if a nav group should be shown
     */
    shouldShowGroup: (items: Array<{ path: string; [key: string]: unknown }>) =>
      shouldShowNavGroup(items, featurePreferences),

    /**
     * Get the feature requirement for a path
     */
    getFeature: (path: string) =>
      getFeatureForPath(path),

    /**
     * Get all enabled features
     */
    getEnabled: () =>
      getEnabledFeatures(featurePreferences),

    /**
     * Check if a specific feature is enabled
     */
    hasFeature: (feature: string) =>
      featurePreferences?.[feature] ?? true,

    /**
     * Get current feature preferences object
     */
    preferences: featurePreferences,
  }), [featurePreferences]);
}
