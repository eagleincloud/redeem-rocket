import { Navigate, useSearchParams } from 'react-router-dom';
import { useBusinessContext } from '../context/BusinessContext';

/**
 * Protects the dashboard route.
 * Redirects to onboarding if:
 * - User's onboarding_done is false/missing
 * - User is not a team member
 * - ?skipOnboarding is not set
 *
 * Query parameters:
 * - ?skipOnboarding=true: Bypass onboarding, go directly to dashboard
 * - Preserves other query parameters when redirecting to onboarding
 */
export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { bizUser, isLoading } = useBusinessContext();
  const [searchParams] = useSearchParams();

  // While loading team member session, show dashboard
  // (BusinessLayout will handle the redirect if needed)
  if (isLoading) {
    return <>{children}</>;
  }

  // Not authenticated
  if (!bizUser) {
    return <Navigate to="/login" replace />;
  }

  const skipOnboarding = searchParams.get('skipOnboarding') === 'true';
  const isTeamMember = bizUser.isTeamMember ?? false;
  const onboardingDone = bizUser.onboarding_done ?? false;

  // Check if onboarding is required
  const needsOnboarding = !onboardingDone && !isTeamMember && !skipOnboarding;

  if (needsOnboarding) {
    // Preserve query params except skipOnboarding
    const params = new URLSearchParams(searchParams);
    params.delete('skipOnboarding');
    const query = params.toString();
    const redirectUrl = `/business/onboarding${query ? '?' + query : ''}`;
    return <Navigate to={redirectUrl} replace />;
  }

  return <>{children}</>;
}

/**
 * Protects onboarding route.
 * Allows access only if:
 * - User is authenticated
 * - User hasn't completed onboarding OR is explicitly accessing it again
 *
 * Query parameters:
 * - ?onboardingPhase=N: Jump to specific phase (0-4 for development/testing)
 * - ?skipOnboarding=true: After onboarding, allows returning to dashboard
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { bizUser, isLoading } = useBusinessContext();

  // While loading, show onboarding
  if (isLoading) {
    return <>{children}</>;
  }

  // Not authenticated
  if (!bizUser) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, allow access to onboarding
  // (They might be re-running it from profile page)
  return <>{children}</>;
}

/**
 * Feature-based route guard.
 * Checks if a feature is enabled in feature_preferences before allowing access.
 *
 * Example: <FeatureGuard feature="lead_management"><LeadsPage /></FeatureGuard>
 */
export function FeatureGuard({
  feature,
  children,
  fallback = null,
}: {
  feature: keyof any;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { bizUser } = useBusinessContext();

  // If no preferences set yet, allow access (backward compatibility)
  if (!bizUser?.feature_preferences) {
    return <>{children}</>;
  }

  // Check if feature is enabled
  const isEnabled = (bizUser.feature_preferences as Record<string, boolean>)[feature] ?? true;

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
