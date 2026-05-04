import React, { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      required = false,
      leftIcon,
      rightIcon,
      id,
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`form-group ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className={required ? 'label label-required' : 'label'}>
            {label}
          </label>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span style={{ position: 'absolute', left: 'var(--space-8)', pointerEvents: 'none' }}>
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`input ${leftIcon ? 'pl-8' : ''} ${rightIcon ? 'pr-8' : ''} ${className}`}
            style={{
              paddingLeft: leftIcon ? 'var(--space-20)' : undefined,
              paddingRight: rightIcon ? 'var(--space-20)' : undefined,
            }}
            {...props}
          />

          {rightIcon && (
            <span style={{ position: 'absolute', right: 'var(--space-8)', pointerEvents: 'none' }}>
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error-400)', marginTop: 'var(--space-4)' }}>
            {error}
          </p>
        )}

        {hint && !error && (
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
              marginTop: 'var(--space-4)',
            }}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
