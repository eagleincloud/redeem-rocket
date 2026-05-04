import React, { InputHTMLAttributes } from 'react';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  id?: string;
  containerClassName?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, id, containerClassName = '', className = '', ...props }, ref) => {
    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`form-group ${containerClassName}`}>
        <label className="toggle" htmlFor={toggleId}>
          <input
            ref={ref}
            type="checkbox"
            id={toggleId}
            className={`toggle-input ${className}`}
            {...props}
          />
          {label && <span className="toggle-label">{label}</span>}
        </label>
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';
