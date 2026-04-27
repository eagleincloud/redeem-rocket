import { useState, useCallback } from 'react';
import { getValidationMessage } from '../utils/errorMessages';

/**
 * Validation rule definition
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  custom?: (value: any) => string | null;
}

/**
 * Form field state
 */
export interface FormFieldState {
  value: string | number;
  error: string;
}

/**
 * Hook for form validation and state management
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: Record<keyof T, ValidationRule> = {}
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (fieldName: keyof T, value: any): string => {
      const rule = rules[fieldName];
      if (!rule) return '';

      const fieldLabel = String(fieldName).replace(/_/g, ' ');

      // Required
      if (rule.required && (!value || value.toString().trim() === '')) {
        return getValidationMessage(fieldLabel, 'required', fieldLabel);
      }

      // Email
      if (rule.email && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return getValidationMessage(fieldLabel, 'email');
        }
      }

      // Phone
      if (rule.phone && value) {
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          return getValidationMessage(fieldLabel, 'phone');
        }
      }

      // Min length
      if (rule.minLength && value && value.toString().length < rule.minLength) {
        return getValidationMessage(fieldLabel, 'minLength', rule.minLength);
      }

      // Max length
      if (rule.maxLength && value && value.toString().length > rule.maxLength) {
        return getValidationMessage(fieldLabel, 'maxLength', rule.maxLength);
      }

      // Pattern
      if (rule.pattern && value && !rule.pattern.test(value)) {
        return getValidationMessage(fieldLabel, 'pattern');
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) return customError;
      }

      return '';
    },
    [rules]
  );

  /**
   * Validate all fields
   */
  const validateAll = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    Object.keys(values).forEach((fieldName) => {
      const error = validateField(fieldName as keyof T, values[fieldName as keyof T]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return newErrors;
  }, [values, validateField]);

  /**
   * Handle field value change
   */
  const handleChange = useCallback(
    (fieldName: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));
      setIsDirty(true);

      // Validate if field has been touched
      if (touched[String(fieldName)]) {
        const error = validateField(fieldName, value);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error,
        }));
      }
    },
    [touched, validateField]
  );

  /**
   * Handle field blur
   */
  const handleBlur = useCallback((fieldName: keyof T) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    const error = validateField(fieldName, values[fieldName]);
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  }, [validateField, values]);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [initialValues]);

  /**
   * Set field value programmatically
   */
  const setFieldValue = useCallback((fieldName: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  /**
   * Set error message for a field
   */
  const setFieldError = useCallback((fieldName: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  }, []);

  /**
   * Check if form is valid
   */
  const isValid = useCallback((): boolean => {
    const newErrors = validateAll();
    return Object.keys(newErrors).length === 0;
  }, [validateAll]);

  /**
   * Get field state (for FormField component)
   */
  const getFieldProps = useCallback(
    (fieldName: keyof T) => ({
      name: String(fieldName),
      value: values[fieldName],
      onChange: (value: any) => handleChange(fieldName, value),
      onBlur: () => handleBlur(fieldName),
      error: errors[String(fieldName)],
    }),
    [values, errors, handleChange, handleBlur]
  );

  return {
    // State
    values,
    errors,
    touched,
    isDirty,

    // Methods
    handleChange,
    handleBlur,
    handleSubmit: validateAll,
    reset,
    setFieldValue,
    setFieldError,
    isValid,

    // Utilities
    validateField,
    validateAll,
    getFieldProps,
  };
}

/**
 * Example usage:
 *
 * function LoginForm() {
 *   const { values, errors, getFieldProps, isValid, handleSubmit } = useFormValidation(
 *     { email: '', password: '' },
 *     {
 *       email: { required: true, email: true },
 *       password: { required: true, minLength: 8 },
 *     }
 *   );
 *
 *   const handleLogin = async () => {
 *     const validationErrors = handleSubmit();
 *     if (Object.keys(validationErrors).length) return;
 *
 *     await login(values.email, values.password);
 *   };
 *
 *   return (
 *     <>
 *       <FormField label="Email" type="email" {...getFieldProps('email')} />
 *       <FormField label="Password" type="password" {...getFieldProps('password')} />
 *       <button onClick={handleLogin} disabled={!isValid()}>Login</button>
 *     </>
 *   );
 * }
 */
