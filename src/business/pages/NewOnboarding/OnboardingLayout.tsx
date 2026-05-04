import React, { ReactNode } from 'react';
import { motion } from 'motion/react';

interface OnboardingLayoutProps {
  children: ReactNode;
  step?: number;
  totalSteps?: number;
  showProgress?: boolean;
}

/**
 * OnboardingLayout - Wrapper component for consistent onboarding styling
 * Provides background, progress indicator, and responsive layout
 */
export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  step = 1,
  totalSteps = 5,
  showProgress = true,
}) => {
  const progressPercentage = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Progress indicator */}
      {showProgress && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-4 w-full max-w-md z-10"
        >
          {/* Progress bar */}
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-primary to-purple-600"
            />
          </div>

          {/* Step counter */}
          <p className="text-xs text-muted-foreground text-center m-0">
            Step {step} of {totalSteps}
          </p>
        </motion.div>
      )}

      {/* Content container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`relative z-10 w-full max-w-md ${showProgress ? 'mt-16' : ''}`}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default OnboardingLayout;
