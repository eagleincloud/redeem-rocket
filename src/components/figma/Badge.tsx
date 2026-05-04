import React, { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  icon,
  className = '',
}) => {
  const variantClass = variant !== 'default' ? `badge-${variant}` : '';

  return (
    <span className={`badge ${variantClass} ${className}`}>
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
