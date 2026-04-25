import { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Loader } from 'lucide-react';
import { supabase } from '../../../../app/lib/supabase';

interface Question {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  helpText?: string;
}

interface DynamicJourneyPhaseProps {
  businessType?: string;
  selectedFeatures?: string[];
  answers?: Record<string, any>;
  onChange?: (answers: Record<string, any>) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  initialAnswers?: Record<string, any>;
}

export function DynamicJourneyPhase({
  businessType = 'restaurant',
  selectedFeatures = [],
  answers = {},
  onChange,
  onNext,
  onPrevious,
  initialAnswers = {},
}: DynamicJourneyPhaseProps) {
  const [localAnswers, setLocalAnswers] = useState(initialAnswers || answers);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [databaseQuestions, setDatabaseQuestions] = useState<Question[]>([]);

  // Fetch questions from database on mount
  useEffect(() => {
    const fetchDynamicQuestions = async () => {
      if (!businessType || !supabase) return;

      setLoadingQuestions(true);
      try {
        const { data, error } = await supabase
          .from('feature_sets_by_industry')
          .select('dynamic_questions')
          .eq('business_category', businessType)
          .single();

        if (error || !data?.dynamic_questions) {
          console.warn('Failed to load dynamic questions from database:', error);
          setLoadingQuestions(false);
          return;
        }

        const questionsData = data.dynamic_questions as any;
        if (questionsData.questions && Array.isArray(questionsData.questions)) {
          setDatabaseQuestions(questionsData.questions);
        }
      } catch (err) {
        console.error('[DynamicJourneyPhase] Error fetching questions:', err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchDynamicQuestions();
  }, [businessType]);

  // Define questions based on business type and selected features
  const baseQuestions: Question[] = [
    {
      id: 'business_description',
      question: 'Describe your business in a few words',
      type: 'textarea',
      placeholder: 'E.g., High-end Italian restaurant with focus on fresh pasta and wine selection',
      required: true,
      helpText: 'This helps our AI create more personalized configurations',
    },
    {
      id: 'operating_hours',
      question: 'What are your typical operating hours?',
      type: 'text',
      placeholder: 'E.g., 9 AM to 6 PM, Mon-Sat',
      required: true,
      helpText: 'We use this to schedule automations and email sequences',
    },
    {
      id: 'target_customers',
      question: 'Who are your primary customers?',
      type: 'textarea',
      placeholder: 'E.g., Young professionals, families, students',
      required: true,
      helpText: 'Helps personalize marketing strategies',
    },
  ];

  const featureSpecificQuestions: Record<string, Question[]> = {
    email_campaigns: [
      {
        id: 'email_frequency',
        question: 'How often would you like to send emails?',
        type: 'select',
        options: ['Weekly', 'Bi-weekly', 'Monthly', 'As needed'],
        required: true,
      },
      {
        id: 'email_goals',
        question: 'What are your main email goals?',
        type: 'checkbox',
        options: [
          'Promote products/services',
          'Share updates',
          'Drive conversions',
          'Build relationships',
          'Request feedback',
        ],
        required: true,
      },
    ],
    product_catalog: [
      {
        id: 'product_count',
        question: 'Approximately how many products/services do you offer?',
        type: 'select',
        options: ['1-10', '11-50', '51-200', '200+'],
        required: true,
      },
    ],
    lead_management: [
      {
        id: 'lead_sources',
        question: 'Where do most of your leads come from?',
        type: 'checkbox',
        options: [
          'Website inquiry forms',
          'Social media',
          'Phone calls',
          'Walk-ins',
          'Referrals',
          'Advertising',
        ],
        required: true,
      },
    ],
    automation: [
      {
        id: 'automation_priority',
        question: 'What would you like to automate most?',
        type: 'checkbox',
        options: [
          'Customer follow-ups',
          'Order processing',
          'Payment reminders',
          'Appointment reminders',
          'Data entry',
          'Reporting',
        ],
        required: true,
      },
    ],
  };

  // Combine questions based on selected features
  // Prefer database questions if available, fall back to hardcoded questions
  const questions = useMemo(() => {
    if (databaseQuestions.length > 0) {
      return databaseQuestions;
    }

    let combined = [...baseQuestions];
    selectedFeatures.forEach((feature) => {
      const featureQuestions = featureSpecificQuestions[feature];
      if (featureQuestions) {
        combined = combined.concat(featureQuestions);
      }
    });
    return combined;
  }, [selectedFeatures, databaseQuestions]);

  const handleAnswerChange = (fieldId: string, value: any) => {
    const updatedAnswers = { ...localAnswers, [fieldId]: value };
    setLocalAnswers(updatedAnswers);
    onChange?.(updatedAnswers);
  };

  const completedCount = questions.filter(
    (q) => q.id in localAnswers && localAnswers[q.id]
  ).length;
  const progressPercent = (completedCount / Math.max(questions.length, 1)) * 100;

  const colors = {
    bg: '#0a0e27',
    card: '#111827',
    border: '#1f2937',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#ff4400',
    success: '#10b981',
    hover: '#1a1f3a',
  };

  // Show loading state
  if (loadingQuestions) {
    return (
      <div style={{ width: '100%', textAlign: 'center', padding: '60px 20px' }}>
        <Loader size={40} style={{
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px',
          color: colors.accent
        }} />
        <h2 style={{ color: colors.text, marginBottom: '8px' }}>Loading questions...</h2>
        <p style={{ color: colors.textMuted }}>Customizing questions for your business type</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: colors.text,
            margin: '0 0 12px 0',
            lineHeight: '1.2',
          }}
        >
          Tell Us About Your Business
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: colors.textMuted,
            margin: '0 0 16px 0',
            lineHeight: '1.5',
          }}
        >
          Answer a few quick questions so we can customize your setup perfectly
        </p>

        {/* Progress Bar */}
        <div
          style={{
            height: '4px',
            background: colors.border,
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '12px',
          }}
        >
          <div
            style={{
              height: '100%',
              background: colors.accent,
              width: `${progressPercent}%`,
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>
        <span
          style={{
            display: 'inline-block',
            fontSize: '12px',
            color: colors.textMuted,
            marginTop: '8px',
          }}
        >
          {completedCount} of {questions.length} completed
        </span>
      </div>

      {/* Questions */}
      <div style={{ marginBottom: '32px' }}>
        {questions.map((question, index) => (
          <div
            key={question.id}
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '16px',
            }}
          >
            {/* Question Number and Title */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.accent,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Question {index + 1} of {questions.length}
              </label>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: 0,
                  lineHeight: '1.4',
                }}
              >
                {question.question}
                {question.required && (
                  <span style={{ color: '#ef4444' }}>*</span>
                )}
              </h3>
              {question.helpText && (
                <p
                  style={{
                    fontSize: '12px',
                    color: colors.textMuted,
                    margin: '8px 0 0 0',
                    fontStyle: 'italic',
                  }}
                >
                  {question.helpText}
                </p>
              )}
            </div>

            {/* Text Input */}
            {question.type === 'text' && (
              <input
                type="text"
                value={localAnswers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.text,
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = colors.accent;
                }}
                onBlur={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = colors.border;
                }}
              />
            )}

            {/* Textarea Input */}
            {question.type === 'textarea' && (
              <textarea
                value={localAnswers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '80px',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = colors.accent;
                }}
                onBlur={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = colors.border;
                }}
              />
            )}

            {/* Select Input */}
            {question.type === 'select' && (
              <select
                value={localAnswers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.text,
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = colors.accent;
                }}
                onBlur={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = colors.border;
                }}
              >
                <option value="">Select an option...</option>
                {question.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* Checkbox Input */}
            {question.type === 'checkbox' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {question.options?.map((option) => (
                  <label
                    key={option}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '6px',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = colors.hover;
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'transparent';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        Array.isArray(localAnswers[question.id])
                          ? localAnswers[question.id].includes(option)
                          : false
                      }
                      onChange={(e) => {
                        const currentValues = Array.isArray(localAnswers[question.id])
                          ? localAnswers[question.id]
                          : [];
                        const newValues = e.target.checked
                          ? [...currentValues, option]
                          : currentValues.filter((v) => v !== option);
                        handleAnswerChange(question.id, newValues);
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '14px', color: colors.text }}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Radio Input */}
            {question.type === 'radio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {question.options?.map((option) => (
                  <label
                    key={option}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '6px',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = colors.hover;
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'transparent';
                    }}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={localAnswers[question.id] === option}
                      onChange={() => handleAnswerChange(question.id, option)}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '14px', color: colors.text }}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Info */}
      <div
        style={{
          background: colors.bg,
          borderRadius: '12px',
          padding: '16px',
          fontSize: '13px',
          color: colors.textMuted,
          textAlign: 'center',
          marginBottom: '24px',
        }}
      >
        <p style={{ margin: 0 }}>
          Your answers help our AI create personalized pipelines and automation rules. You can always adjust
          these settings later.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {onPrevious && (
          <button
            onClick={onPrevious}
            style={{
              flex: 1,
              padding: '16px',
              background: 'transparent',
              border: `1.5px solid ${colors.border}`,
              color: colors.textMuted,
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.text;
              el.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.border;
              el.style.color = colors.textMuted;
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>
        )}
        {onNext && (
          <button
            onClick={() => {
              onChange?.(localAnswers);
              onNext?.();
            }}
            style={{
              flex: 1,
              padding: '16px',
              background: colors.accent,
              border: 'none',
              color: 'white',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              const el = e.target as HTMLElement;
              el.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              const el = e.target as HTMLElement;
              el.style.opacity = '1';
            }}
          >
            Continue
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
