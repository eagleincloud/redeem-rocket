import { createBrowserRouter, redirect } from 'react-router';
import Welcome from './components/Welcome';
import BusinessDetails from './components/BusinessDetails';
import FeatureSelection from './components/FeatureSelection';
import AppCustomization from './components/AppCustomization';
import Preview from './components/Preview';
import DashboardShell from './components/DashboardShell';
import Dashboard from './components/Dashboard';
import LeadsPage from './components/LeadsPage';
import MarketingPage from './components/MarketingPage';
import AutomationPage from './components/AutomationPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
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

  // Onboarding (requires auth)
  { path: '/details', Component: BusinessDetails, loader: authLoader },
  { path: '/features', Component: FeatureSelection, loader: authLoader },
  { path: '/customize', Component: AppCustomization, loader: authLoader },
  { path: '/preview', Component: Preview, loader: authLoader },

  // Dashboard (requires auth)
  {
    path: '/dashboard',
    Component: DashboardShell,
    loader: authLoader,
    children: [
      { index: true, Component: Dashboard },
      { path: 'leads', Component: LeadsPage },
      { path: 'marketing', Component: MarketingPage },
      { path: 'automation', Component: AutomationPage },
      { path: 'settings', Component: SettingsPage },
    ],
  },

  { path: '*', loader: () => redirect('/') },
]);
