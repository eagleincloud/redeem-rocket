import React from 'react';
import { HelpText, Tooltip } from './Tooltip';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  tooltip?: string;
  className?: string;
}

/**
 * FormField component with error and help text
 */
export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  helpText,
  placeholder,
  required = false,
  disabled = false,
  maxLength,
  minLength,
  pattern,
  tooltip,
  className = '',
}: FormFieldProps) {
  const hasError = !!error;

  return (
    <div style={{ marginBottom: '18px' }} className={className}>
      {/* Label with tooltip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <label
          htmlFor={name}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {label}
          {required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
        </label>
        {tooltip && <Tooltip content={tooltip} />}
      </div>

      {/* Input field */}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        required={required}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '6px',
          border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
          fontSize: '13px',
          fontFamily: 'inherit',
          backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
          color: '#1f2937',
          transition: 'all 0.15s',
          boxShadow: hasError ? '0 0 0 2px rgba(220,38,38,0.1)' : 'none',
          opacity: disabled ? 0.6 : 1,
        }}
        onFocus={(e) => {
          if (!hasError) {
            (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px rgba(59,130,246,0.1)';
          }
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = hasError ? '#dc2626' : '#d1d5db';
          (e.currentTarget as HTMLElement).style.boxShadow = hasError ? '0 0 0 2px rgba(220,38,38,0.1)' : 'none';
        }}
      />

      {/* Error message */}
      {hasError && (
        <div
          style={{
            fontSize: '12px',
            color: '#dc2626',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>✕</span>
          {error}
        </div>
      )}

      {/* Help text */}
      {!hasError && helpText && <HelpText text={helpText} />}
    </div>
  );
}

/**
 * Textarea field with error and help text
 */
interface TextareaFieldProps extends Omit<FormFieldProps, 'type'> {
  rows?: number;
}

export function TextareaField({
  label,
  name,
  value,
  onChange,
  error,
  helpText,
  placeholder,
  required = false,
  disabled = false,
  maxLength,
  tooltip,
  rows = 4,
  className = '',
}: TextareaFieldProps) {
  const hasError = !!error;

  return (
    <div style={{ marginBottom: '18px' }} className={className}>
      {/* Label with tooltip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <label
          htmlFor={name}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          {label}
          {required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
        </label>
        {tooltip && <Tooltip content={tooltip} />}
      </div>

      {/* Textarea */}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        required={required}
        rows={rows}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '6px',
          border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
          fontSize: '13px',
          fontFamily: 'inherit',
          backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
          color: '#1f2937',
          transition: 'all 0.15s',
          boxShadow: hasError ? '0 0 0 2px rgba(220,38,38,0.1)' : 'none',
          opacity: disabled ? 0.6 : 1,
          resize: 'vertical',
        }}
        onFocus={(e) => {
          if (!hasError) {
            (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px rgba(59,130,246,0.1)';
          }
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = hasError ? '#dc2626' : '#d1d5db';
          (e.currentTarget as HTMLElement).style.boxShadow = hasError ? '0 0 0 2px rgba(220,38,38,0.1)' : 'none';
        }}
      />

      {/* Error message */}
      {hasError && (
        <div
          style={{
            fontSize: '12px',
            color: '#dc2626',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>✕</span>
          {error}
        </div>
      )}

      {/* Help text */}
      {!hasError && helpText && <HelpText text={helpText} />}
    </div>
  );
}
