import { ReactNode } from 'react';
import { Button } from '@/app/components/ui/button';

interface EmptyStateCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
}: EmptyStateCardProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      minHeight: '400px',
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(79, 70, 229, 0.1)',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '16px',
        opacity: 0.8,
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '8px',
        color: '#1e293b',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '24px',
        maxWidth: '400px',
        lineHeight: '1.6',
      }}>
        {description}
      </p>
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="default">
            {actionLabel}
          </Button>
        )}
        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} variant="outline">
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
