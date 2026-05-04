import React, { SelectHTMLAttributes, ReactNode } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      required = false,
      options,
      placeholder,
      id,
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`form-group ${containerClassName}`}>
        {label && (
          <label htmlFor={selectId} className={required ? 'label label-required' : 'label'}>
            {label}
          </label>
        )}

        <select ref={ref} id={selectId} className={`select ${className}`} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

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

Select.displayName = 'Select';
