import React, { ReactNode } from 'react';
import { useMobileView } from '../hooks/useMobileView';
import { MobileBottomNav } from './MobileBottomNav';
import { OfflineIndicator } from './OfflineIndicator';
import { cn } from '@/components/ui/utils';

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  showOfflineIndicator?: boolean;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

/**
 * Mobile-optimized layout wrapper
 * Handles safe areas, bottom navigation, and offline indicators
 */
export function MobileLayout({
  children,
  showBottomNav = true,
  showOfflineIndicator = true,
  className,
  header,
  footer,
}: MobileLayoutProps) {
  const { isMobile } = useMobileView();

  if (!isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        {header}
        <main className={className}>{children}</main>
        {footer}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Offline Indicator */}
      {showOfflineIndicator && <OfflineIndicator />}

      {/* Header */}
      {header && (
        <header className="sticky top-0 z-40 border-b border-border bg-background">
          {header}
        </header>
      )}

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 overflow-y-auto',
          showBottomNav && 'pb-20',
          className
        )}
      >
        {children}
      </main>

      {/* Footer */}
      {footer && <footer className="border-t border-border bg-background">{footer}</footer>}

      {/* Bottom Navigation */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}

/**
 * Mobile page header component
 */
export function MobilePageHeader({
  title,
  subtitle,
  actions,
  onBack,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Go back"
            >
              ←
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground line-clamp-1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Mobile section component with safe spacing
 */
export function MobileSection({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn('px-4 py-4', className)}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Mobile card component with proper spacing
 */
export function MobileCard({
  children,
  className,
  onClick,
  actionable = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  actionable?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-border bg-card p-4',
        actionable && 'cursor-pointer active:scale-95 transition-transform',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Mobile list item component
 */
export function MobileListItem({
  title,
  subtitle,
  trailing,
  onClick,
  className,
}: {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 py-3 px-4 rounded-lg',
        onClick && 'cursor-pointer active:bg-secondary transition-colors',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </div>
  );
}

export default MobileLayout;
