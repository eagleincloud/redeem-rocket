/**
 * Friendly error message mappings
 * Converts technical errors to user-friendly messages
 */

export const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'network_error': 'Connection failed. Please check your internet and try again.',
  'timeout': 'Request timed out. Please try again.',
  'offline': 'You appear to be offline. Check your internet connection.',

  // Auth errors
  'invalid_credentials': 'Email or password is incorrect.',
  'user_not_found': 'No account found with this email address.',
  'email_already_exists': 'An account with this email already exists.',
  'password_too_weak': 'Password must be at least 8 characters with a mix of letters and numbers.',
  'email_not_verified': 'Please verify your email before logging in.',
  'session_expired': 'Your session has expired. Please log in again.',
  'unauthorized': 'You do not have permission to perform this action.',

  // Validation errors
  'email_invalid': 'Please enter a valid email address.',
  'phone_invalid': 'Please enter a valid phone number.',
  'field_required': 'This field is required.',
  'min_length': 'This field is too short.',
  'max_length': 'This field is too long.',

  // Business logic errors
  'business_not_found': 'Business not found. Please contact support.',
  'lead_not_found': 'Lead not found. It may have been deleted.',
  'offer_not_found': 'Offer not found. It may have been deleted.',
  'campaign_not_found': 'Campaign not found. It may have been deleted.',

  // Feature errors
  'feature_locked': 'This feature requires a higher plan. Upgrade to access it.',
  'limit_reached': 'You\'ve reached your usage limit for this feature.',
  'insufficient_credits': 'Insufficient credits. Please add more to continue.',

  // Database errors
  'database_error': 'A database error occurred. Please try again.',
  'duplicate_entry': 'This entry already exists.',
  'constraint_violation': 'Cannot complete this action due to existing references.',

  // File upload errors
  'file_too_large': 'File size exceeds the maximum limit of 10MB.',
  'invalid_file_type': 'File type not supported. Please use JPG, PNG, or PDF.',
  'upload_failed': 'File upload failed. Please try again.',

  // Generic error
  'default': 'Something went wrong. Please try again or contact support.',
};

/**
 * Parse error object and return user-friendly message
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for known error patterns
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      if (message.includes(key.replace(/_/g, ' '))) {
        return value;
      }
    }

    // Return original message if it's not too technical
    if (!message.includes('supabase') && !message.includes('postgresql')) {
      return error.message;
    }
  }

  return ERROR_MESSAGES.default;
}

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES: Record<string, (value?: any) => string> = {
  'email': () => 'Please enter a valid email address (e.g., user@example.com).',
  'phone': () => 'Please enter a valid phone number.',
  'required': (field: string = 'This field') => `${field} is required.`,
  'minLength': (min: number) => `Must be at least ${min} characters long.`,
  'maxLength': (max: number) => `Must be no more than ${max} characters.`,
  'pattern': () => 'Please enter a valid format.',
  'number': () => 'Please enter a valid number.',
  'url': () => 'Please enter a valid URL (e.g., https://example.com).',
  'date': () => 'Please enter a valid date.',
};

/**
 * Get validation message for form field
 */
export function getValidationMessage(
  field: string,
  rule: string,
  params?: any
): string {
  const messageGenerator = VALIDATION_MESSAGES[rule];
  if (messageGenerator) {
    return messageGenerator(params || field);
  }
  return `Invalid ${field}. Please check and try again.`;
}

/**
 * Help text for common features
 */
export const HELP_TEXT: Record<string, string> = {
  'lead_pipeline': 'Move leads through your sales pipeline by dragging them between stages.',
  'lead_source': 'Where did this lead come from? (e.g., Website, Referral, Social Media)',
  'lead_stage': 'Current status of the lead in your sales process.',
  'offer_discount': 'Offer a percentage or fixed amount discount to attract customers.',
  'campaign_budget': 'Total budget allocated for this campaign. You can pause anytime.',
  'automation_trigger': 'The condition that will automatically trigger this action.',
  'email_template': 'Create reusable email templates to save time on repetitive messages.',
  'contact_frequency': 'How often you\'ll reach out to this contact (to avoid overwhelming them).',
  'tag': 'Add tags to organize and categorize your leads and customers.',
  'custom_field': 'Add custom fields to track information specific to your business.',
};

/**
 * Get help text for a feature
 */
export function getHelpText(feature: string): string | undefined {
  return HELP_TEXT[feature];
}

/**
 * Success messages
 */
export const SUCCESS_MESSAGES: Record<string, string> = {
  'lead_created': 'Lead created successfully.',
  'lead_updated': 'Lead updated successfully.',
  'lead_deleted': 'Lead deleted successfully.',
  'offer_created': 'Offer created successfully.',
  'offer_updated': 'Offer updated successfully.',
  'offer_deleted': 'Offer deleted successfully.',
  'campaign_created': 'Campaign created successfully.',
  'campaign_started': 'Campaign started successfully.',
  'campaign_paused': 'Campaign paused successfully.',
  'settings_saved': 'Settings saved successfully.',
  'profile_updated': 'Profile updated successfully.',
  'password_changed': 'Password changed successfully.',
  'email_verified': 'Email verified successfully.',
  'file_uploaded': 'File uploaded successfully.',
  'action_completed': 'Action completed successfully.',
};
