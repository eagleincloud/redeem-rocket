import React, { ReactNode, useState } from 'react';
import { Navigation } from './Navigation';

interface AppShellProps {
  children: ReactNode;
  showNavigation?: boolean;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  showNavigation = true,
  className = '',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--color-dark-bg)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-family-base)',
      }}
    >
      {/* Navigation */}
      {showNavigation && (
        <Navigation mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      )}

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          width: '100%',
        }}
      >
        {children}
      </main>
    </div>
  );
};
