import { getSession } from './auth';

const LEGACY_KEY = 'redeem_rocket_data';

export interface AppData {
  // Step 1: Business Basics
  businessName: string;
  email: string;
  phone: string;

  // Step 2: Category & Profile
  category: string;
  location: string;
  teamSize: string;
  businessStage: string;
  targetAudience: string;

  // Step 3: Goals & Challenges
  goals: string[];
  challenges: string[];
  monthlyCustomers: string;
  socialMedia: string[];

  // Feature Selection
  selectedFeatures: string[];

  // App Customization
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

const defaultData: AppData = {
  businessName: '',
  email: '',
  phone: '',
  category: '',
  location: '',
  teamSize: '',
  businessStage: '',
  targetAudience: '',
  goals: [],
  challenges: [],
  monthlyCustomers: '',
  socialMedia: [],
  selectedFeatures: [],
  appName: '',
  stylePresetId: '',
  primaryColor: '#3B82F6',
  accentColor: '#8B5CF6',
  bgColor: '#FFFFFF',
  theme: 'light',
  fontStyle: 'modern',
  layoutStyle: 'card',
  buttonStyle: 'rounded',
};

/** Returns the storage key for the current user's app data */
function getStorageKey(): string {
  const session = getSession();
  if (session?.userId) return `rr_app_data_${session.userId}`;
  return LEGACY_KEY;
}

export function saveAppData(data: Partial<AppData>): void {
  try {
    const existing = getAppData();
    localStorage.setItem(getStorageKey(), JSON.stringify({ ...existing, ...data }));
  } catch {}
}

export function getAppData(): AppData {
  try {
    const stored = localStorage.getItem(getStorageKey());
    if (stored) return { ...defaultData, ...JSON.parse(stored) };
  } catch {}
  return { ...defaultData };
}

export function clearAppData(): void {
  localStorage.removeItem(getStorageKey());
}

/** Returns true if the current user has completed onboarding (has category + preset chosen) */
export function hasCompletedSetup(): boolean {
  const data = getAppData();
  return !!(data.category && data.stylePresetId);
}
