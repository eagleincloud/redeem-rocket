import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { BusinessProvider } from './context/BusinessContext';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { BusinessLayout } from './components/BusinessLayout';
import { OnboardingOrchestrator } from "./components/onboarding/OnboardingOrchestrator";
import { DashboardGuard, OnboardingGuard } from './components/RouteGuards';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorElement } from './components/ErrorElement';
import { LandingPage } from './pages/LandingPage';
import { BusinessWebsitePage } from './pages/BusinessWebsitePage';
import { DashboardPage } from './components/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { EmailVerificationPage } from '@/app/components/EmailVerificationPage';
import { StartPage } from './pages/StartPage';

// ── Lazy Load Heavy Components ───────────────────────────────────────────────
// Dashboard & Analytics
const DashboardV2Page = lazy(() => import('./pages/DashboardV2Page'));
const AnalyticsPage = lazy(() => import('./components/AnalyticsPage'));

// Products & Inventory
const ProductsPage = lazy(() => import('./components/ProductsPage'));
const PhotosPage = lazy(() => import('./components/PhotosPage'));
const OffersPage = lazy(() => import('./components/OffersPage'));
const AuctionsManagePage = lazy(() => import('./components/AuctionsManagePage'));
const OrdersManagePage = lazy(() => import('./components/OrdersManagePage'));
const RequirementsManagePage = lazy(() => import('./components/RequirementsManagePage'));

// Finance & Payments
const FinancePage = lazy(() => import('./components/FinancePage'));
const ExpensesPage = lazy(() => import('./components/ExpensesPage'));
const FinancialReportsPage = lazy(() => import('./components/FinancialReportsPage'));
const InvoicesPage = lazy(() => import('./components/InvoicesPage'));
const BusinessWalletPage = lazy(() => import('./components/BusinessWalletPage'));
const PaymentDashboard = lazy(() => import('./components/PaymentDashboard'));
const PaymentLinkGenerator = lazy(() => import('./components/PaymentLinkGenerator'));
const StripeCheckout = lazy(() => import('./components/StripeCheckout'));
const InvoiceBuilder = lazy(() => import('./components/InvoiceBuilder'));

// CRM & Leads
const LeadsPage = lazy(() => import('./components/LeadsPage'));
const OutreachPage = lazy(() => import('./components/OutreachPage'));
const TeamPage = lazy(() => import('./components/TeamPage'));

// Marketing & Growth
const MarketingPage = lazy(() => import('./components/MarketingPage'));
const CampaignsPage = lazy(() => import('./components/CampaignsPage'));
const GrowthPage = lazy(() => import('./components/GrowthPage'));
const SocialPage = lazy(() => import('./components/SocialPage'));

// Settings & Configuration
const BusinessProfilePage = lazy(() => import('./components/BusinessProfilePage'));
const FeatureSettings = lazy(() => import('./components/FeatureSettings'));
const BusinessNotificationsPage = lazy(() => import('./components/BusinessNotificationsPage'));
const SubscriptionPage = lazy(() => import('./components/SubscriptionPage'));
const EmailSetupPage = lazy(() => import('./components/EmailSetupPage'));
const ConnectorsPage = lazy(() => import('./components/ConnectorsPage'));
const AutomationPage = lazy(() => import('./components/AutomationPage'));

// ── Loading Fallback ─────────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0e27',
      color: '#ffffff',
      fontSize: '16px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⚙️</div>
        <p>Loading...</p>
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

// ── Root wrapper that supplies global providers ───────────────────────────────
function Root() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <ErrorBoundary>
          <BusinessLayout />
        </ErrorBoundary>
      </BusinessProvider>
    </ThemeProvider>
  );
}

// ── Onboarding Root ──────────────────────────────────────────────────────────
function OnboardingRoot() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <ErrorBoundary>
          <OnboardingGuard>
            <OnboardingOrchestrator />
          </OnboardingGuard>
        </ErrorBoundary>
      </BusinessProvider>
    </ThemeProvider>
  );
}

function NewLoginRoot() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <ErrorBoundary>
          <LoginPage />
        </ErrorBoundary>
      </BusinessProvider>
    </ThemeProvider>
  );
}

function SignupRoot() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <ErrorBoundary>
          <SignupPage />
        </ErrorBoundary>
      </BusinessProvider>
    </ThemeProvider>
  );
}

function ForgotPasswordRoot() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <ErrorBoundary>
          <ForgotPasswordPage />
        </ErrorBoundary>
      </BusinessProvider>
    </ThemeProvider>
  );
}

function VerificationRoot() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <ErrorBoundary>
          <EmailVerificationPage />
        </ErrorBoundary>
      </BusinessProvider>
    </ThemeProvider>
  );
}

function BusinessWebsiteRoot() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BusinessWebsitePage />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

function StartPageRoot() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <ErrorBoundary>
          <StartPage />
        </ErrorBoundary>
      </BusinessProvider>
    </ThemeProvider>
  );
}

// ── Lazy Wrapper for Pages ───────────────────────────────────────────────────
function LazyPageWrapper({ Component }: { Component: React.ComponentType<any> }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter(
  [
  {
    path: '/',
    element: <LandingPageRoot />,
    errorElement: <ErrorElement />,
  },
  {
    path: '/login',
    element: <NewLoginRoot />,
    errorElement: <ErrorElement />,
  },
  {
    path: '/signup',
    element: <SignupRoot />,
    errorElement: <ErrorElement />,
  },
  {
    path: '/verify-email',
    element: <VerificationRoot />,
    errorElement: <ErrorElement />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordRoot />,
    errorElement: <ErrorElement />,
  },
  // Smart Onboarding route (protected, lazy-loaded)
  // Supports query params: ?skipOnboarding=true, ?onboardingPhase=N (for development)
  {
    path: '/business/onboarding',
    element: <OnboardingRoot />,
    errorElement: <ErrorElement />,
  },
  {
    path: '/start',
    element: <StartPageRoot />,
    errorElement: <ErrorElement />,
  },
  {
    path: '/app',
    element: <Root />,
    errorElement: <ErrorElement />,
    children: [
      // Dashboard with onboarding guard
      {
        index: true,
        element: (
          <DashboardGuard>
            <DashboardPage />
          </DashboardGuard>
        ),
        errorElement: <ErrorElement />,
      },
      { path: 'dashboard-v2',  element: <DashboardGuard><Suspense fallback={<LoadingFallback />}><DashboardV2Page /></Suspense></DashboardGuard>, errorElement: <ErrorElement /> },
      { path: 'products',      element: <Suspense fallback={<LoadingFallback />}><ProductsPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'offers',        element: <Suspense fallback={<LoadingFallback />}><OffersPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'auctions',      element: <Suspense fallback={<LoadingFallback />}><AuctionsManagePage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'orders',        element: <Suspense fallback={<LoadingFallback />}><OrdersManagePage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'requirements',  element: <Suspense fallback={<LoadingFallback />}><RequirementsManagePage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'wallet',        element: <Suspense fallback={<LoadingFallback />}><BusinessWalletPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'analytics',     element: <Suspense fallback={<LoadingFallback />}><AnalyticsPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'grow',          element: <Suspense fallback={<LoadingFallback />}><GrowthPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'photos',        element: <Suspense fallback={<LoadingFallback />}><PhotosPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'profile',       element: <Suspense fallback={<LoadingFallback />}><BusinessProfilePage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'features-settings', element: <Suspense fallback={<LoadingFallback />}><FeatureSettings /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'notifications', element: <Suspense fallback={<LoadingFallback />}><BusinessNotificationsPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'subscription',  element: <Suspense fallback={<LoadingFallback />}><SubscriptionPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'marketing',     element: <Suspense fallback={<LoadingFallback />}><MarketingPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'campaigns',     element: <Suspense fallback={<LoadingFallback />}><CampaignsPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'invoices',      element: <Suspense fallback={<LoadingFallback />}><InvoicesPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'finance',       element: <Suspense fallback={<LoadingFallback />}><FinancePage businessId="" /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'expenses',      element: <Suspense fallback={<LoadingFallback />}><ExpensesPage businessId="" userId="" /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'reports',       element: <Suspense fallback={<LoadingFallback />}><FinancialReportsPage businessId="" /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'leads',         element: <Suspense fallback={<LoadingFallback />}><LeadsPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'outreach',      element: <Suspense fallback={<LoadingFallback />}><OutreachPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'team',          element: <Suspense fallback={<LoadingFallback />}><TeamPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'email-setup',   element: <Suspense fallback={<LoadingFallback />}><EmailSetupPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'connectors',    element: <Suspense fallback={<LoadingFallback />}><ConnectorsPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'automation',    element: <Suspense fallback={<LoadingFallback />}><AutomationPage /></Suspense>, errorElement: <ErrorElement /> },
      { path: 'social',        element: <Suspense fallback={<LoadingFallback />}><SocialPage /></Suspense>, errorElement: <ErrorElement /> },
    ],
  },
  // Public business website page
  {
    path: '/biz/:businessId',
    element: <BusinessWebsiteRoot />,
    errorElement: <ErrorElement />,
  },
  // Catch-all route for undefined paths - shows 404
  {
    path: '*',
    element: <ErrorElement />,
    errorElement: <ErrorElement />,
  },
  ],
  { basename: import.meta.env.PROD ? '/' : '/business.html' }
);

// Helper function for LandingPageRoot
function LandingPageRoot() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <ErrorBoundary>
          <LandingPage />
        </ErrorBoundary>
      </BusinessProvider>
    </ThemeProvider>
  );
}
