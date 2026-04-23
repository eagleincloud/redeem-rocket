import { useState } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export type QuestionType = 'text' | 'dropdown' | 'checkbox' | 'date' | 'time' | 'multi-select' | 'textarea';

export interface QuestionOption {
  label: string;
  value: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  placeholder?: string;
  options?: QuestionOption[];
  required?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customValidator?: (value: any) => boolean | string;
  };
  helperText?: string;
}

interface QuestionBuilderProps {
  question: Question;
  value?: any;
  onChange?: (value: any) => void;
  error?: string;
}

const colors = {
  bg: '#0a0e27',
  card: '#111827',
  border: '#1f2937',
  text: '#ffffff',
  textMuted: '#9ca3af',
  accent: '#ff4400',
  success: '#10b981',
  error: '#ef4444',
  hover: '#1a1f3a',
};

function validateValue(value: any, question: Question): string | null {
  if (question.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return 'This field is required';
  }

  if (value && question.validation) {
    const { minLength, maxLength, pattern, customValidator } = question.validation;

    if (minLength && String(value).length < minLength) {
      return `Minimum ${minLength} characters required`;
    }

    if (maxLength && String(value).length > maxLength) {
      return `Maximum ${maxLength} characters allowed`;
    }

    if (pattern && !new RegExp(pattern).test(String(value))) {
      return 'Invalid format';
    }

    if (customValidator) {
      const result = customValidator(value);
      if (result !== true) {
        return typeof result === 'string' ? result : 'Invalid value';
      }
    }
  }

  return null;
}

export function QuestionBuilder({
  question,
  value = '',
  onChange,
  error: externalError,
}: QuestionBuilderProps) {
  const [internalError, setInternalError] = useState<string | null>(null);
  const error = externalError || internalError;

  const handleChange = (newValue: any) => {
    const validationError = validateValue(newValue, question);
    setInternalError(validationError);
    onChange?.(newValue);
  };

  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={question.placeholder}
            value={String(value || '')}
            onChange={e => handleChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: colors.card,
              border: `1.5px solid ${error ? colors.error : colors.border}`,
              color: colors.text,
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
            onFocus={e => {
              e.target.style.borderColor = error ? colors.error : colors.accent;
              e.target.style.boxShadow = `0 0 0 3px ${error ? colors.error + '20' : colors.accent + '20'}`;
            }}
            onBlur={e => {
              e.target.style.borderColor = error ? colors.error : colors.border;
              e.target.style.boxShadow = 'none';
            }}
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={question.placeholder}
            value={String(value || '')}
            onChange={e => handleChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: colors.card,
              border: `1.5px solid ${error ? colors.error : colors.border}`,
              color: colors.text,
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              minHeight: '100px',
              resize: 'vertical',
              transition: 'all 0.2s ease',
            }}
            onFocus={e => {
              e.target.style.borderColor = error ? colors.error : colors.accent;
              e.target.style.boxShadow = `0 0 0 3px ${error ? colors.error + '20' : colors.accent + '20'}`;
            }}
            onBlur={e => {
              e.target.style.borderColor = error ? colors.error : colors.border;
              e.target.style.boxShadow = 'none';
            }}
          />
        );
      case 'dropdown':
        return (
          <div style={{ position: 'relative' }}>
            <select
              value={String(value || '')}
              onChange={e => handleChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                paddingRight: '40px',
                background: colors.card,
                border: `1.5px solid ${error ? colors.error : colors.border}`,
                color: colors.text,
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                appearance: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <option value="">{question.placeholder || 'Select an option'}</option>
              {question.options?.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: colors.textMuted }} />
          </div>
        );
      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'all 0.2s ease' }}>
            <input type="checkbox" checked={Boolean(value)} onChange={e => handleChange(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: colors.accent }} />
            <span style={{ color: colors.text, fontSize: '14px', fontWeight: 500 }}>{question.title}</span>
          </label>
        );
      case 'multi-select':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {question.options?.map(option => (
              <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px 12px', background: colors.card, borderRadius: '8px', border: `1.5px solid ${colors.border}`, transition: 'all 0.2s ease' }}>
                <input type="checkbox" checked={(Array.isArray(value) ? value : []).includes(option.value)} onChange={e => { const newValue = Array.isArray(value) ? [...value] : []; if (e.target.checked) { newValue.push(option.value); } else { newValue.splice(newValue.indexOf(option.value), 1); } handleChange(newValue); }} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colors.accent }} />
                <span style={{ color: colors.text, fontSize: '14px' }}>{option.label}</span>
              </label>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {question.type !== 'checkbox' && (
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>
          {question.title}
          {question.required && <span style={{ color: colors.error, marginLeft: '4px' }}>*</span>}
        </label>
      )}
      {question.subtitle && <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '12px', lineHeight: '1.4' }}>{question.subtitle}</p>}
      <div style={{ marginBottom: '8px' }}>{renderInput()}</div>
      {error && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', color: colors.error, marginBottom: '8px' }}>
          <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
      {question.helperText && !error && <p style={{ fontSize: '12px', color: colors.textMuted, margin: '8px 0 0 0', lineHeight: '1.4' }}>{question.helperText}</p>}
    </div>
  );
}
