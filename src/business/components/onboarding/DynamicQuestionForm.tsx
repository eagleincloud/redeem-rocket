import React, { useState, useCallback, useMemo } from 'react';
import { AlertCircle, ChevronDown, Loader2 } from 'lucide-react';

export type QuestionType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';

export interface ConditionalLogic {
  dependsOn?: string;
  showWhen?: string | string[];
  hideWhen?: string | string[];
}

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  question: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  placeholder?: string;
  options?: QuestionOption[];
  conditionalLogic?: ConditionalLogic;
  helpText?: string;
}

export interface DynamicQuestionFormProps {
  questions: Question[];
  onSubmit: (answers: Record<string, any>) => void | Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
}

interface FormErrors {
  [key: string]: string;
}

const MOCK_QUESTIONS: Question[] = [
  {
    id: 'business_size',
    question: 'What is your business size?',
    description: 'Help us understand your organization scope',
    type: 'radio',
    required: true,
    options: [
      { value: 'solo', label: 'Solo/Freelancer', description: 'Just me' },
      { value: 'small', label: 'Small Team', description: '2-10 people' },
      { value: 'medium', label: 'Medium Business', description: '11-50 people' },
      { value: 'large', label: 'Enterprise', description: '50+ people' },
    ],
  },
  {
    id: 'primary_goal',
    question: 'What is your primary business goal?',
    description: 'Select the main objective you want to achieve',
    type: 'select',
    required: true,
    options: [
      { value: 'growth', label: 'Business Growth' },
      { value: 'efficiency', label: 'Operational Efficiency' },
      { value: 'revenue', label: 'Revenue Optimization' },
      { value: 'integration', label: 'System Integration' },
    ],
  },
  {
    id: 'integration_needs',
    question: 'Do you need integrations with other tools?',
    description: 'Select all that apply',
    type: 'checkbox',
    required: false,
    options: [
      { value: 'crm', label: 'CRM System' },
      { value: 'accounting', label: 'Accounting Software' },
      { value: 'email', label: 'Email Platform' },
      { value: 'analytics', label: 'Analytics Tools' },
      { value: 'none', label: 'None needed' },
    ],
  },
  {
    id: 'additional_notes',
    question: 'Any additional information we should know?',
    description: 'Tell us about specific requirements or preferences',
    type: 'textarea',
    required: false,
    placeholder: 'Share any specific needs, preferences, or constraints...',
  },
];

const DynamicQuestionForm: React.FC<DynamicQuestionFormProps> = ({
  questions = MOCK_QUESTIONS,
  onSubmit,
  onBack,
  loading = false,
  title = 'Complete Your Profile',
  description = 'Answer a few questions to get started',
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter visible questions based on conditional logic
  const visibleQuestions = useMemo(() => {
    return questions.filter(q => {
      if (!q.conditionalLogic) return true;

      const { dependsOn, showWhen, hideWhen } = q.conditionalLogic;
      if (!dependsOn) return true;

      const dependencyValue = answers[dependsOn];
      if (dependencyValue === undefined) return true;

      if (showWhen) {
        const showValues = Array.isArray(showWhen) ? showWhen : [showWhen];
        return showValues.includes(String(dependencyValue));
      }

      if (hideWhen) {
        const hideValues = Array.isArray(hideWhen) ? hideWhen : [hideWhen];
        return !hideValues.includes(String(dependencyValue));
      }

      return true;
    });
  }, [questions, answers]);

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const totalQuestions = visibleQuestions.length;
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const validateQuestion = useCallback(
    (question: Question, value: any): string | null => {
      if (question.required && !value) {
        return `${question.question} is required`;
      }

      if (question.type === 'text' && value && value.length < 2) {
        return 'Response must be at least 2 characters';
      }

      if (question.type === 'textarea' && value && value.length < 10) {
        return 'Response must be at least 10 characters';
      }

      return null;
    },
    []
  );

  const handleAnswerChange = useCallback(
    (value: any) => {
      const newErrors = { ...errors };
      delete newErrors[currentQuestion.id];

      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
      setErrors(newErrors);
    },
    [currentQuestion, errors]
  );

  const handleNext = useCallback(async () => {
    const error = validateQuestion(currentQuestion, answers[currentQuestion.id]);

    if (error) {
      setErrors(prev => ({
        ...prev,
        [currentQuestion.id]: error,
      }));
      return;
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestion, currentQuestionIndex, totalQuestions, answers, validateQuestion]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleSubmit = useCallback(async () => {
    const error = validateQuestion(currentQuestion, answers[currentQuestion.id]);

    if (error) {
      setErrors(prev => ({
        ...prev,
        [currentQuestion.id]: error,
      }));
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(answers);
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        general: err instanceof Error ? err.message : 'Failed to submit form',
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [currentQuestion, answers, onSubmit, validateQuestion]);

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const renderQuestionInput = () => {
    const value = answers[currentQuestion.id] || '';

    switch (currentQuestion.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={e => handleAnswerChange(e.target.value)}
            placeholder={currentQuestion.placeholder || `Answer the question...`}
            disabled={isSubmitting || loading}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={e => handleAnswerChange(e.target.value)}
            placeholder={currentQuestion.placeholder || 'Type your response...'}
            disabled={isSubmitting || loading}
            rows={5}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 resize-none"
          />
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map(option => (
              <label
                key={option.value}
                className="flex items-start gap-4 p-4 rounded-lg border border-slate-600 bg-slate-700/50 cursor-pointer hover:bg-slate-700 hover:border-slate-500 transition-all duration-200"
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={e => handleAnswerChange(e.target.value)}
                  disabled={isSubmitting || loading}
                  className="mt-1 h-4 w-4 text-purple-500 cursor-pointer accent-purple-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-white">{option.label}</p>
                  {option.description && (
                    <p className="text-sm text-slate-400 mt-1">
                      {option.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map(option => (
              <label
                key={option.value}
                className="flex items-start gap-4 p-4 rounded-lg border border-slate-600 bg-slate-700/50 cursor-pointer hover:bg-slate-700 hover:border-slate-500 transition-all duration-200"
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={selectedValues.includes(option.value)}
                  onChange={e => {
                    const newValues = e.target.checked
                      ? [...selectedValues, e.target.value]
                      : selectedValues.filter(v => v !== e.target.value);
                    handleAnswerChange(newValues);
                  }}
                  disabled={isSubmitting || loading}
                  className="mt-1 h-4 w-4 text-purple-500 rounded cursor-pointer accent-purple-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-white">{option.label}</p>
                  {option.description && (
                    <p className="text-sm text-slate-400 mt-1">
                      {option.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      case 'select':
        return (
          <div className="relative">
            <select
              value={value}
              onChange={e => handleAnswerChange(e.target.value)}
              disabled={isSubmitting || loading}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Select an option...</option>
              {currentQuestion.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-slate-400">{description}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-300">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
            <p className="text-sm font-medium text-purple-400">
              {Math.round(progressPercent)}%
            </p>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-400">{errors.general}</p>
          </div>
        )}

        {/* Question Content */}
        {currentQuestion && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 mb-8">
            {/* Question Title */}
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentQuestion.question}
            </h2>

            {/* Question Description */}
            {currentQuestion.description && (
              <p className="text-slate-400 mb-6">{currentQuestion.description}</p>
            )}

            {/* Input Field */}
            <div className="mb-6">
              {renderQuestionInput()}

              {/* Error Message */}
              {errors[currentQuestion.id] && (
                <div className="mt-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">
                    {errors[currentQuestion.id]}
                  </p>
                </div>
              )}
            </div>

            {/* Help Text */}
            {currentQuestion.helpText && (
              <p className="text-xs text-slate-500 italic">
                {currentQuestion.helpText}
              </p>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={isFirstQuestion || isSubmitting || loading}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isFirstQuestion || isSubmitting || loading
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            Previous
          </button>

          <div className="flex-1" />

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || loading}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                isSubmitting || loading
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Complete
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={isSubmitting || loading}
              className="px-8 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicQuestionForm;
