/**
 * Feature Guards and Authentication Guards
 * Provides route-level access control and feature flags
 */

import React, { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type FeatureType =
  | 'automation'
  | 'leads'
  | 'email'
  | 'campaigns'
  | 'pipelines'
  | 'marketplace'
  | 'integrations'
  | 'analytics'
  | 'team_management'
  | 'advanced_rules';

export interface FeatureGuardProps {
  feature: FeatureType;
  children: ReactNode;
  fallback?: ReactNode;
  requiresAuth?: boolean;
  onAccessDenied?: () => void;
}

export interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE FLAG CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const FEATURE_FLAGS: Record<FeatureType, boolean> = {
  automation: true,
  leads: true,
  email: true,
  campaigns: true,
  pipelines: true,
  marketplace: true,
  integrations: true,
  analytics: true,
  team_management: true,
  advanced_rules: false, // Requires premium
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM HOOKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook to check if a feature is enabled
 */
export function useFeatureFlag(feature: FeatureType): boolean {
  return FEATURE_FLAGS[feature] || false;
}

/**
 * Hook to check authentication status
 */
export function useAuthStatus(): {
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to check if a feature is accessible for current user
 */
export function useHasFeatureAccess(feature: FeatureType): boolean {
  const { isAuthenticated } = useAuthStatus();
  const isFeatureEnabled = useFeatureFlag(feature);

  return isAuthenticated && isFeatureEnabled;
}

// ─────────────────────────────────────────────────────────────────────────────
// GUARD COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FeatureGuard - Controls access to features based on feature flags
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  children,
  fallback,
  requiresAuth = true,
  onAccessDenied,
}) => {
  const { isAuthenticated, isLoading } = useAuthStatus();
  const isFeatureEnabled = useFeatureFlag(feature);
  const navigate = useNavigate();

  const hasAccess = useCallback(() => {
    if (isLoading) return false;

    if (requiresAuth && !isAuthenticated) {
      onAccessDenied?.();
      navigate('/login');
      return false;
    }

    if (!isFeatureEnabled) {
      onAccessDenied?.();
      return false;
    }

    return true;
  }, [isAuthenticated, isLoading, isFeatureEnabled, requiresAuth, navigate, onAccessDenied]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#888',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess()) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#888',
        fontSize: '14px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>Access to this feature is not available.</p>
          <button
            onClick={() => navigate('/app')}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * AuthGuard - Ensures user is authenticated before showing content
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuthStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#888',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * Require authentication middleware for routes
 */
export function requireAuth(allowedRoles?: string[]): (props: any) => boolean {
  return (props: any) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    if (allowedRoles) {
      const role = localStorage.getItem('user_role');
      return allowedRoles.includes(role || '');
    }

    return true;
  };
}

/**
 * Require feature access middleware for routes
 */
export function requiresFeature(feature: FeatureType): (props: any) => boolean {
  return (props: any) => {
    return FEATURE_FLAGS[feature] || false;
  };
}

/**
 * Enable or disable a feature flag
 */
export function setFeatureFlag(feature: FeatureType, enabled: boolean): void {
  FEATURE_FLAGS[feature] = enabled;
}

/**
 * Get all feature flags status
 */
export function getAllFeatureFlags(): Record<FeatureType, boolean> {
  return { ...FEATURE_FLAGS };
}

/**
 * Check if a feature is accessible
 */
export function canAccessFeature(
  feature: FeatureType,
  checkAuth: boolean = true
): boolean {
  if (checkAuth) {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;
  }

  return FEATURE_FLAGS[feature] || false;
}
