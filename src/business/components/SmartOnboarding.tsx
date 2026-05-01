/**
 * SmartOnboarding - Re-exports FigmaSmartOnboarding
 * This file now uses the beautiful Figma design system with multi-phase onboarding
 */

import { FigmaSmartOnboarding } from './SmartOnboarding/FigmaSmartOnboarding';

interface OnboardingProps {
  onComplete?: (data: any) => void;
  businessType?: string;
}

export function SmartOnboarding({ onComplete, businessType = 'general' }: OnboardingProps) {
  return <FigmaSmartOnboarding onComplete={onComplete} />;
}
