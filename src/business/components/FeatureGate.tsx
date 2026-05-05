/**
 * Feature Gate Components
 * Conditional rendering based on feature availability
 */

import React from 'react';
import { useFeatureFlag, useFeatureFlagDetails } from '@/business/hooks/useFeatureFlag';
import type { FeatureFlagProps, UpgradePromptProps, PlanTier, Feature } from '@/types/features';

// ═══════════════════════════════════════════════════════════════════════════
// Feature Gate Component - Conditional Rendering
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render children only if feature is enabled
 * Renders fallback if feature is disabled
 */
export const FeatureGate: React.FC<FeatureFlagProps> = ({
  name,
  fallback = null,
  children,
}) => {
  const isEnabled = useFeatureFlag(name);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ═══════════════════════════════════════════════════════════════════════════
// Feature Flag Badge Component
// ═══════════════════════════════════════════════════════════════════════════

interface FeatureBadgeProps {
  feature: string;
  variant?: 'beta' | 'new' | 'coming-soon';
}

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({
  feature,
  variant = 'beta',
}) => {
  const variants = {
    beta: 'bg-yellow-100 text-yellow-800',
    new: 'bg-green-100 text-green-800',
    'coming-soon': 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {variant === 'beta' && '⚡ Beta'}
      {variant === 'new' && '✨ New'}
      {variant === 'coming-soon' && '🔜 Coming Soon'}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Upgrade Prompt Component
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Show upgrade prompt when feature requires higher plan
 */
export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  currentPlan,
  requiredPlan,
  onUpgrade,
}) => {
  const planNames = {
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };

  const planPrices = {
    starter: '$29',
    professional: '$99',
    enterprise: 'Custom',
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-600 p-6 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Upgrade to unlock {feature}
          </h3>
          <p className="text-gray-700 mb-3">
            This feature is available on the {planNames[requiredPlan]} plan and above.
            Your current plan ({planNames[currentPlan]}) doesn't include access.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="text-sm">
              <span className="text-gray-600">Upgrade to </span>
              <span className="font-semibold text-indigo-600">
                {planNames[requiredPlan]} ({planPrices[requiredPlan]}/mo)
              </span>
            </div>
          </div>

          <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Coming Soon Component (For Gradual Rollout)
// ═══════════════════════════════════════════════════════════════════════════

interface ComingSoonProps {
  feature: string;
  rolloutPercentage?: number;
  onNotifyMe?: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  feature,
  rolloutPercentage = 0,
  onNotifyMe,
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6 rounded-lg text-center">
      <div className="mb-4">
        <svg className="h-12 w-12 text-amber-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {feature} is coming soon
      </h3>

      <p className="text-gray-700 mb-4">
        We're working on {feature} and it will be available to you very soon.
        {rolloutPercentage > 0 && (
          <span className="block mt-2 text-sm">
            Currently available to {rolloutPercentage}% of users
          </span>
        )}
      </p>

      {rolloutPercentage > 0 && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${rolloutPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {rolloutPercentage}% rollout in progress
          </p>
        </div>
      )}

      {onNotifyMe && (
        <button
          onClick={onNotifyMe}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
        >
          Notify Me When Available
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Feature Status Indicator Component
// ═══════════════════════════════════════════════════════════════════════════

interface FeatureStatusProps {
  feature: string;
  showDetails?: boolean;
}

export const FeatureStatus: React.FC<FeatureStatusProps> = ({
  feature,
  showDetails = false,
}) => {
  const details = useFeatureFlagDetails(feature);

  if (details.loading) {
    return <div className="text-gray-500 text-sm">Loading...</div>;
  }

  if (details.error) {
    return <div className="text-red-600 text-sm">Error: {details.error}</div>;
  }

  return (
    <div className="flex items-center gap-2">
      {details.enabled ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm text-green-700">Available</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
          <span className="text-sm text-gray-600">Not available</span>
        </>
      )}

      {showDetails && (
        <div className="ml-2 text-xs text-gray-500">
          (Rollout: {details.rolloutPercentage}%)
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Disabled Button (for features) Component
// ═══════════════════════════════════════════════════════════════════════════

interface DisabledFeatureButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  feature: string;
  tooltip?: string;
  children: React.ReactNode;
}

export const DisabledFeatureButton: React.FC<DisabledFeatureButtonProps> = ({
  feature,
  tooltip = `${feature} is not available on your plan`,
  children,
  ...props
}) => {
  const isEnabled = useFeatureFlag(feature);

  if (isEnabled) {
    return <button {...props}>{children}</button>;
  }

  return (
    <div className="group relative inline-block">
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed opacity-50"
      >
        {children}
      </button>
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
        {tooltip}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Feature Requirements Component
// ═══════════════════════════════════════════════════════════════════════════

interface FeatureRequirementsProps {
  feature: Feature;
}

export const FeatureRequirements: React.FC<FeatureRequirementsProps> = ({
  feature,
}) => {
  if (!feature.dependencies || feature.dependencies.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 mb-2">Requirements</h4>
      <ul className="space-y-1">
        {feature.dependencies.map((dep) => (
          <li key={dep} className="flex items-center gap-2 text-sm text-blue-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Requires {dep}
          </li>
        ))}
      </ul>
    </div>
  );
};
