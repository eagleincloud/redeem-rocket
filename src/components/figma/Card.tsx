import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', compact = false, onClick }) => {
  const baseClass = compact ? 'card card-compact' : 'card';
  return (
    <div className={`${baseClass} ${className}`} onClick={onClick} role="region">
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`card-header ${className}`}>
      <div>
        {title && <h3 className="card-title">{title}</h3>}
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return <div className={`card-body ${className}`}>{children}</div>;
};
