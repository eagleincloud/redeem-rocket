import { createBrowserRouter, redirect } from 'react-router';
import Welcome from './components/Welcome';
import BusinessDetails from './components/BusinessDetails';
import FeatureSelection from './components/FeatureSelection';
import AppCustomization from './components/AppCustomization';
import Preview from './components/Preview';
import DashboardShell from './components/DashboardShell';
import Dashboard from './components/Dashboard';
import LeadsPageEnhanced from './components/LeadsPageEnhanced';
import MarketingPageEnhanced from './components/MarketingPageEnhanced';
import AutomationPageEnhanced from './components/AutomationPageEnhanced';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LoyaltyPageEnhanced from './components/LoyaltyPageEnhanced';
import BookingsPageEnhanced from './components/BookingsPageEnhanced';
import StorePageEnhanced from './components/StorePageEnhanced';
import AnalyticsPage from './components/AnalyticsPage';
import TeamPageEnhanced from './components/TeamPageEnhanced';
import SmartOnboarding from './components/SmartOnboarding';
import FeatureMarketplace from './components/FeatureMarketplace';
import { isLoggedIn } from './utils/auth';
import { hasCompletedSetup } from './utils/appState';

/** Redirect authenticated users away from auth pages */
function guestLoader() {
  if (isLoggedIn()) {
    return redirect(hasCompletedSetup() ? '/dashboard' : '/details');
  }
  return null;
}

/** Require user to be logged in */
function authLoader() {
  if (!isLoggedIn()) return redirect('/login');
  return null;
}

export const router = createBrowserRouter([
  // Public pages
  { path: '/', Component: Welcome },
  { path: '/login', Component: LoginPage, loader: guestLoader },
  { path: '/register', Component: RegisterPage, loader: guestLoader },

  // Smart Onboarding (requires auth)
  { path: '/onboarding', Component: SmartOnboarding, loader: authLoader },

  // Feature Marketplace (requires auth)
  { path: '/features', Component: FeatureMarketplace, loader: authLoader },

  // Initial Setup Onboarding (requires auth)
  { path: '/details', Component: BusinessDetails, loader: authLoader },
  { path: '/feature-selection', Component: FeatureSelection, loader: authLoader },
  { path: '/customize', Component: AppCustomization, loader: authLoader },
  { path: '/preview', Component: Preview, loader: authLoader },

  // Dashboard (requires auth)
  {
    path: '/dashboard',
    Component: DashboardShell,
    loader: authLoader,
    children: [
      { index: true, Component: Dashboard },
      { path: 'leads', Component: LeadsPageEnhanced },
      { path: 'marketing', Component: MarketingPageEnhanced },
      { path: 'automation', Component: AutomationPageEnhanced },
      { path: 'loyalty', Component: LoyaltyPageEnhanced },
      { path: 'bookings', Component: BookingsPageEnhanced },
      { path: 'store', Component: StorePageEnhanced },
      { path: 'analytics', Component: AnalyticsPage },
      { path: 'team', Component: TeamPageEnhanced },
      { path: 'settings', Component: SettingsPage },
    ],
  },

  { path: '*', loader: () => redirect('/') },
]);
