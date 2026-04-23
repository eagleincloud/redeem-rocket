import type { Question } from '@/business/components/onboarding/QuestionBuilder';

export type BusinessCategory = 'restaurant' | 'saas' | 'ecommerce' | 'services' | 'other';

const RESTAURANT_QUESTIONS: Question[] = [
  { id: 'operating_hours', type: 'text', title: 'What are your operating hours?', subtitle: 'Help customers know when you\'re open', placeholder: 'e.g., 9am-9pm weekdays', helperText: 'You can enter natural language', required: true, validation: { minLength: 5 } },
  { id: 'delivery_options', type: 'multi-select', title: 'What delivery options do you offer?', subtitle: 'Select all that apply', options: [{ label: 'In-store dining', value: 'dine_in' }, { label: 'Takeout/Pickup', value: 'takeout' }, { label: 'Delivery (your staff)', value: 'delivery_own' }, { label: 'Third-party delivery', value: 'delivery_third_party' }, { label: 'Catering', value: 'catering' }], required: true },
  { id: 'payment_methods', type: 'multi-select', title: 'What payment methods do you accept?', subtitle: 'Select all that apply', options: [{ label: 'Cash', value: 'cash' }, { label: 'Card', value: 'card' }, { label: 'UPI', value: 'upi' }, { label: 'Wallet', value: 'wallet' }, { label: 'Bank Transfer', value: 'bank_transfer' }], required: true },
  { id: 'average_order_value', type: 'dropdown', title: 'What\'s your typical average order value?', placeholder: 'Select a range', options: [{ label: 'Under 500', value: 'under_500' }, { label: '500 - 1,000', value: '500_1000' }, { label: '1,000 - 2,500', value: '1000_2500' }, { label: '2,500 - 5,000', value: '2500_5000' }, { label: 'Above 5,000', value: 'above_5000' }], required: true },
  { id: 'cuisine_specialty', type: 'text', title: 'What\'s your cuisine specialty?', placeholder: 'e.g., North Indian cuisine', required: true, validation: { minLength: 3 } },
];

const SAAS_QUESTIONS: Question[] = [
  { id: 'sales_stages', type: 'text', title: 'What are your typical sales stages?', placeholder: 'e.g., Lead → Qualified → Proposal → Won', helperText: 'Describe your sales funnel', required: true, validation: { minLength: 5 } },
  { id: 'ideal_customer_profile', type: 'textarea', title: 'Describe your ideal customer profile', placeholder: 'Company size, industry, use case, budget range', required: true, validation: { minLength: 20 } },
  { id: 'sales_cycle_length', type: 'dropdown', title: 'How long is your typical sales cycle?', placeholder: 'Select duration', options: [{ label: 'Less than 1 month', value: 'less_1m' }, { label: '1-3 months', value: '1_3m' }, { label: '3-6 months', value: '3_6m' }, { label: '6-12 months', value: '6_12m' }, { label: 'More than 1 year', value: 'more_1y' }], required: true },
  { id: 'email_provider', type: 'dropdown', title: 'Which email service do you currently use?', placeholder: 'Select', options: [{ label: 'Gmail', value: 'gmail' }, { label: 'Outlook', value: 'outlook' }, { label: 'HubSpot', value: 'hubspot' }, { label: 'Mailchimp', value: 'mailchimp' }, { label: 'Other', value: 'other' }], required: false },
  { id: 'team_size', type: 'dropdown', title: 'What\'s your sales team size?', placeholder: 'Select range', options: [{ label: '1-2', value: '1_2' }, { label: '3-5', value: '3_5' }, { label: '5-10', value: '5_10' }, { label: '10-20', value: '10_20' }, { label: '20+', value: '20_plus' }], required: true },
];

const ECOMMERCE_QUESTIONS: Question[] = [
  { id: 'product_count', type: 'dropdown', title: 'How many products do you offer?', placeholder: 'Select range', options: [{ label: '1-50', value: '1_50' }, { label: '50-200', value: '50_200' }, { label: '200-1000', value: '200_1000' }, { label: '1000-5000', value: '1000_5000' }, { label: '5000+', value: '5000_plus' }], required: true },
  { id: 'international_shipping', type: 'checkbox', title: 'Do you ship internationally?', required: false },
  { id: 'loyalty_program', type: 'checkbox', title: 'Do you have a loyalty/rewards program?', required: false },
  { id: 'marketplaces', type: 'multi-select', title: 'Which marketplaces do you sell on?', subtitle: 'Select all that apply', options: [{ label: 'Your own website', value: 'own_website' }, { label: 'Amazon', value: 'amazon' }, { label: 'Flipkart', value: 'flipkart' }, { label: 'Myntra', value: 'myntra' }, { label: 'Meesho', value: 'meesho' }], required: true },
  { id: 'primary_product_category', type: 'dropdown', title: 'What\'s your primary product category?', placeholder: 'Select category', options: [{ label: 'Electronics', value: 'electronics' }, { label: 'Fashion', value: 'fashion' }, { label: 'Home & Garden', value: 'home' }, { label: 'Beauty', value: 'beauty' }, { label: 'Sports', value: 'sports' }], required: true },
];

const SERVICES_QUESTIONS: Question[] = [
  { id: 'service_categories', type: 'text', title: 'What types of services do you offer?', placeholder: 'List main categories', required: true, validation: { minLength: 5 } },
  { id: 'booking_system', type: 'checkbox', title: 'Do you need an online booking system?', required: false },
  { id: 'availability_calendar', type: 'checkbox', title: 'Do you need availability/calendar management?', required: false },
  { id: 'payment_terms', type: 'dropdown', title: 'When do customers typically pay?', placeholder: 'Select timing', options: [{ label: 'Upfront', value: 'upfront' }, { label: 'After service', value: 'after_service' }, { label: 'Mixed', value: 'mixed' }, { label: 'Subscription', value: 'subscription' }], required: true },
  { id: 'average_service_value', type: 'dropdown', title: 'What\'s your average service value?', placeholder: 'Select range', options: [{ label: 'Under 500', value: 'under_500' }, { label: '500 - 2,000', value: '500_2000' }, { label: '2,000 - 10,000', value: '2000_10000' }, { label: '10,000+', value: '10000_plus' }], required: true },
  { id: 'team_size', type: 'dropdown', title: 'How many team members do you have?', placeholder: 'Select range', options: [{ label: 'Solo', value: 'solo' }, { label: '2-5', value: '2_5' }, { label: '5-10', value: '5_10' }, { label: '10-20', value: '10_20' }, { label: '20+', value: '20_plus' }], required: true },
];

const GENERIC_QUESTIONS: Question[] = [
  { id: 'business_description', type: 'textarea', title: 'Describe your business', placeholder: 'What products/services? Who are customers?', required: true, validation: { minLength: 20 } },
  { id: 'business_goals', type: 'text', title: 'What are your primary business goals?', placeholder: 'What do you want to achieve?', required: true, validation: { minLength: 5 } },
  { id: 'revenue_range', type: 'dropdown', title: 'What\'s your annual revenue range?', placeholder: 'Select range', options: [{ label: 'Under 5L', value: 'under_5l' }, { label: '5-25L', value: '5_25l' }, { label: '25L-1Cr', value: '25l_1cr' }, { label: '1-5Cr', value: '1_5cr' }, { label: '5+Cr', value: '5cr_plus' }], required: false },
  { id: 'biggest_challenge', type: 'textarea', title: 'What\'s your biggest business challenge?', placeholder: 'Describe your pain points', required: false, validation: { minLength: 10 } },
];

export interface GetQuestionsOptions { businessCategory: BusinessCategory; selectedFeatures?: string[]; }
export interface JourneyAnswersRecord { [questionId: string]: any; }

export function getDynamicJourneyQuestions(options: GetQuestionsOptions): Question[] {
  const { businessCategory } = options;
  switch (businessCategory) {
    case 'restaurant': return RESTAURANT_QUESTIONS;
    case 'saas': return SAAS_QUESTIONS;
    case 'ecommerce': return ECOMMERCE_QUESTIONS;
    case 'services': return SERVICES_QUESTIONS;
    default: return GENERIC_QUESTIONS;
  }
}

export function getAllJourneyQuestions(options: GetQuestionsOptions): Question[] {
  return getDynamicJourneyQuestions(options);
}

export function validateJourneyAnswers(answers: JourneyAnswersRecord, questions: Question[]): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  for (const question of questions) {
    const value = answers[question.id];
    if (question.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[question.id] = `${question.title} is required`;
    }
    if (value && question.validation) {
      const { minLength, maxLength } = question.validation;
      if (minLength && String(value).length < minLength) {
        errors[question.id] = `Minimum ${minLength} characters required`;
      }
      if (maxLength && String(value).length > maxLength) {
        errors[question.id] = `Maximum ${maxLength} characters allowed`;
      }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
