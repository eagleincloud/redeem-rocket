/**
 * GlassButton Component
 * Reusable glass-morphic button with dark theme support
 */

import React, { ReactNode } from 'react';
import './GlassButton.css';

interface GlassButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
}) => {
  return (
    <button
      type={type}
      className={`glass-button glass-button--${variant} glass-button--${size} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="glass-button__spinner" />}
      {children}
    </button>
  );
};
