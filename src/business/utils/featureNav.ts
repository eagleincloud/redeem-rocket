/**
 * Maps navigation items to feature flags.
 * If a feature is disabled, its nav items are hidden.
 */
export const FEATURE_NAV_MAP: Record<string, string | null> = {
  // Dashboard - always shown
  '/app': null,

  // Products/Catalog - tied to product_catalog
  '/app/products': 'product_catalog',
  '/app/offers': 'product_catalog',
  '/app/photos': 'product_catalog',
  '/app/wallet': 'product_catalog',
  '/app/invoices': 'product_catalog',

  // Leads & CRM - tied to lead_management
  '/app/leads': 'lead_management',
  '/app/requirements': 'lead_management',

  // Marketing - tied to respective features
  '/app/campaigns': 'email_campaigns',
  '/app/email-setup': 'email_campaigns',
  '/app/connectors': 'email_campaigns',
  '/app/automation': 'automation',
  '/app/social': 'social_media',
  '/app/outreach': 'email_campaigns',
  '/app/analytics': 'email_campaigns',
  '/app/grow': 'email_campaigns',
  '/app/marketing': 'email_campaigns',

  // Settings - always shown
  '/app/profile': null,
  '/app/team': null,
  '/app/subscription': null,
  '/app/notifications': null,
};

/**
 * Checks if a navigation item should be visible based on feature preferences.
 * If no preferences are set (backward compatibility), returns true.
 */
export function isNavItemEnabled(
  path: string,
  featurePreferences?: Record<string, boolean> | null
): boolean {
  // If no preferences set, show all items (backward compatibility)
  if (!featurePreferences) {
    return true;
  }

  const requiredFeature = FEATURE_NAV_MAP[path];

  // If no feature requirement, always show
  if (!requiredFeature) {
    return true;
  }

  // Check if feature is enabled
  return featurePreferences[requiredFeature] ?? true;
}

/**
 * Filters nav items based on feature preferences.
 * Returns only items where the user has enabled the corresponding feature.
 */
export function filterNavItemsByFeatures(
  items: Array<{ path: string; label: string; [key: string]: unknown }>,
  featurePreferences?: Record<string, boolean> | null
) {
  return items.filter(item =>
    isNavItemEnabled(item.path, featurePreferences)
  );
}

/**
 * Gets enabled features for the current user.
 * Returns object with feature names as keys and boolean values.
 */
export function getEnabledFeatures(
  featurePreferences?: Record<string, boolean> | null
): Record<string, boolean> {
  if (!featurePreferences) {
    return {
      product_catalog: true,
      lead_management: true,
      email_campaigns: true,
      automation: true,
      social_media: true,
    };
  }

  return featurePreferences;
}

/**
 * Gets the feature requirement for a given nav path.
 */
export function getFeatureForPath(path: string): string | null {
  return FEATURE_NAV_MAP[path] ?? null;
}

/**
 * Checks if a group should be shown based on its items' feature requirements.
 */
export function shouldShowNavGroup(
  items: Array<{ path: string; [key: string]: unknown }>,
  featurePreferences?: Record<string, boolean> | null
): boolean {
  // Always show if has items without feature requirements
  const hasRequiredItems = items.some(
    item => !FEATURE_NAV_MAP[item.path as string]
  );

  if (hasRequiredItems) {
    return true;
  }

  // Show if at least one feature is enabled
  return items.some(item =>
    isNavItemEnabled(item.path as string, featurePreferences)
  );
}
