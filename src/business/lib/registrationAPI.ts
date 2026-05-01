/**
 * Registration API Client
 * Handles all registration-related API calls
 */

const API_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/registration-api';
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Get default headers with authentication
 */
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(ANON_KEY && { 'Authorization': `Bearer ${ANON_KEY}` }),
  };
}

export interface RegistrationData {
  // Business Basics
  businessName: string;
  email: string;
  phone: string;

  // Category & Profile
  category: string;
  location: string;
  teamSize: string;
  businessStage: string;
  targetAudience: string;

  // Goals & Challenges
  goals: string[];
  challenges: string[];
  monthlyCustomers: string;
  socialMedia: string[];

  // Feature Selection
  selectedFeatures: string[];

  // Customization
  appName: string;
  stylePresetId: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  theme: 'light' | 'dark';
  fontStyle: string;
  layoutStyle: string;
  buttonStyle: string;
}

/**
 * Submit complete registration
 */
export async function submitRegistration(data: RegistrationData) {
  try {
    const response = await fetch(`${API_BASE}?action=submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration submission failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Registration submission error:', error);
    throw error;
  }
}

/**
 * Validate email availability
 */
export async function validateEmail(email: string) {
  try {
    const response = await fetch(`${API_BASE}?action=validate-email`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Email validation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Email validation error:', error);
    throw error;
  }
}

/**
 * Create business account after email verification
 */
export async function createBusiness(registrationId: string, userId: string) {
  try {
    const response = await fetch(`${API_BASE}?action=create-business`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ registrationId, userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Business creation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Business creation error:', error);
    throw error;
  }
}

/**
 * Get design presets for category
 */
export async function getPresetsForCategory(category: string) {
  try {
    const response = await fetch(`${API_BASE}?action=presets&category=${encodeURIComponent(category)}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch presets');
    }

    return await response.json();
  } catch (error) {
    console.error('Preset fetch error:', error);
    throw error;
  }
}
