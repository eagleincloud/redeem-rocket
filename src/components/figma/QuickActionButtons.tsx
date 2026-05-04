import React, { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickActionButtonsProps {
  actions: QuickAction[];
  maxColumns?: number;
  className?: string;
}

export const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  actions,
  maxColumns = 4,
  className = '',
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
        gap: 'var(--space-12)',
      }}
      className={className}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          disabled={action.disabled}
          style={{
            padding: 'var(--space-12)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
            border: `2px solid ${action.color}33`,
            cursor: action.disabled ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-base)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 'var(--space-8)',
            opacity: action.disabled ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!action.disabled) {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
              (e.currentTarget as HTMLElement).style.borderColor = action.color;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
            (e.currentTarget as HTMLElement).style.borderColor = `${action.color}33`;
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 'var(--space-10)',
              height: 'var(--space-10)',
              borderRadius: 'var(--radius-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${action.color}20`,
              color: action.color,
            }}
          >
            {action.icon}
          </div>

          {/* Text content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
            <h4
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
              }}
            >
              {action.label}
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-tertiary)',
                lineHeight: 1.4,
              }}
            >
              {action.description}
            </p>
          </div>

          {/* Arrow indicator */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: action.color,
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            Get Started
            <ArrowRight style={{ width: 'var(--space-3)', height: 'var(--space-3)' }} />
          </div>
        </button>
      ))}
    </div>
  );
};
