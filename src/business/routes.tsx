import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense, ComponentType } from 'react';
import React from 'react';
import { BusinessProvider } from './context/BusinessContext';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { BusinessLayout } from './components/BusinessLayout';
import { SmartOnboarding } from "./components/SmartOnboarding";
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
import { ProductsPage } from './components/ProductsPage';
import { OffersPage } from './components/OffersPage';
import { AuctionsManagePage } from './components/AuctionsManagePage';
import { OrdersManagePage } from './components/OrdersManagePage';
import { RequirementsManagePage } from './components/RequirementsManagePage';
import { BusinessWalletPage } from './components/BusinessWalletPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { GrowthPage } from './components/GrowthPage';
import { PhotosPage } from './components/PhotosPage';
import { BusinessProfilePage } from './components/BusinessProfilePage';
import { FeatureSettings } from './components/FeatureSettings';
import { BusinessNotificationsPage } from './components/BusinessNotificationsPage';
import { SubscriptionPage } from './components/SubscriptionPage';
import { MarketingPage } from './components/MarketingPage';
import { CampaignsPage } from './components/CampaignsPage';
import { InvoicesPage } from './components/InvoicesPage';
import { LeadsPage } from './components/LeadsPage';
import { OutreachPage } from './components/OutreachPage';
import { TeamPage } from './components/TeamPage';
import { RBACProvider } from './context/RBACContext';
import { StartPage } from './pages/StartPage';
import { EmailSetupPage } from './components/EmailSetupPage';
import { ConnectorsPage } from './components/ConnectorsPage';
import { AutomationPage } from './components/AutomationPage';
import { SocialPage } from './components/SocialPage';
import PipelineBoard from './components/Pipeline/PipelineBoard';
import { FeatureGuard, AuthGuard } from './guards/FeatureGuards';

// ── Loading Fallback Components ─────────────────────────────────────────────
function OnboardingFallback() {
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
        <p>Loading onboarding...</p>
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

function RouteLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      color: '#888',
      fontSize: '14px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⚙️</div>
        <p>Loading...</p>
      </div>
    </div>
  );
}

// ── Lazy-loaded Components ──────────────────────────────────────────────────
const LazySmartOnboarding = lazy(() =>
  import('./components/SmartOnboarding').then(mod => ({
    default: mod.SmartOnboarding,
  }))
);

// Automation feature routes - lazy loaded for performance
const LazyRuleList = lazy(() =>
  import('./components/Automation/RuleList').then(mod => ({
    default: mod.RuleList,
  }))
);

const LazyRuleBuilder = lazy(() =>
  import('./components/Automation/RuleBuilder').then(mod => ({
    default: mod.RuleBuilder,
  }))
);

// Wrapper component for rule creation
function RuleBuilderCreateWrapper() {
  return <LazyRuleBuilder mode="create" />;
}

// Wrapper component for rule editing
function RuleBuilderEditWrapper() {
  const { ruleId } = useParams<{ ruleId: string }>();
  return <LazyRuleBuilder mode="edit" ruleId={ruleId} />;
}

// Wrapper component for execution logs
function ExecutionLogsWrapper() {
  const { ruleId } = useParams<{ ruleId: string }>();
  return <LazyExecutionLogs ruleId={ruleId} />;
}

const LazyExecutionLogs = lazy(() =>
  import('./components/Automation/ExecutionLogs').then(mod => ({
    default: mod.ExecutionLogs,
  }))
);

const LazyTemplateManager = lazy(() =>
  import('./components/Automation/TemplateManager').then(mod => ({
    default: mod.TemplateManager,
  }))
);

const LazyRuleDebugger = lazy(() =>
  import('./components/Automation/RuleDebugger').then(mod => ({
    default: mod.RuleDebugger,
  }))
);

// ── Landing Page Root ────────────────────────────────────────────────────────
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

// ── Root wrapper that supplies global providers ───────────────────────────────
function Root() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <RBACProvider>
          <ErrorBoundary>
            <BusinessLayout />
          </ErrorBoundary>
        </RBACProvider>
      </BusinessProvider>
    </ThemeProvider>
  );
}

// ── Onboarding Root with Lazy Loading ────────────────────────────────────────
function OnboardingRoot() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <ErrorBoundary>
          <OnboardingGuard>
            <Suspense fallback={<OnboardingFallback />}>
              <LazySmartOnboarding />
            </Suspense>
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
      { path: 'products',      element: <ProductsPage />, errorElement: <ErrorElement /> },
      { path: 'offers',        element: <OffersPage />, errorElement: <ErrorElement /> },
      { path: 'auctions',      element: <AuctionsManagePage />, errorElement: <ErrorElement /> },
      { path: 'orders',        element: <OrdersManagePage />, errorElement: <ErrorElement /> },
      { path: 'requirements',  element: <RequirementsManagePage />, errorElement: <ErrorElement /> },
      { path: 'wallet',        element: <BusinessWalletPage />, errorElement: <ErrorElement /> },
      { path: 'analytics',     element: <AnalyticsPage />, errorElement: <ErrorElement /> },
      { path: 'grow',          element: <GrowthPage />, errorElement: <ErrorElement /> },
      { path: 'photos',        element: <PhotosPage />, errorElement: <ErrorElement /> },
      { path: 'profile',       element: <BusinessProfilePage />, errorElement: <ErrorElement /> },
      { path: 'features-settings', element: <FeatureSettings />, errorElement: <ErrorElement /> },
      { path: 'notifications', element: <BusinessNotificationsPage />, errorElement: <ErrorElement /> },
      { path: 'subscription',  element: <SubscriptionPage />, errorElement: <ErrorElement /> },
      { path: 'marketing',     element: <MarketingPage />, errorElement: <ErrorElement /> },
      { path: 'campaigns',     element: <CampaignsPage />, errorElement: <ErrorElement /> },
      { path: 'invoices',      element: <InvoicesPage />, errorElement: <ErrorElement /> },
      { path: 'finance',       element: <FinancePage />, errorElement: <ErrorElement /> },
      { path: 'expenses',      element: <ExpensesPage />, errorElement: <ErrorElement /> },
      { path: 'financial-reports', element: <FinancialReportsPage />, errorElement: <ErrorElement /> },
      { path: 'invoice-builder', element: <InvoiceBuilder />, errorElement: <ErrorElement /> },
      { path: 'payments',      element: <PaymentDashboard />, errorElement: <ErrorElement /> },
      { path: 'payment-links', element: <PaymentLinkGenerator />, errorElement: <ErrorElement /> },
      { path: 'checkout',      element: <StripeCheckout />, errorElement: <ErrorElement /> },
      { path: 'leads',         element: <LeadsPage />, errorElement: <ErrorElement /> },
      { path: 'outreach',      element: <OutreachPage />, errorElement: <ErrorElement /> },
      { path: 'team',          element: <TeamPage />, errorElement: <ErrorElement /> },
      { path: 'email-setup',   element: <EmailSetupPage />, errorElement: <ErrorElement /> },
      { path: 'connectors',    element: <ConnectorsPage />, errorElement: <ErrorElement /> },
      { path: 'social',        element: <SocialPage />, errorElement: <ErrorElement /> },
      { path: 'pipelines',     element: <PipelineBoard pipelineId="" />, errorElement: <ErrorElement /> },
      { path: 'pipelines/:id', element: <PipelineBoard pipelineId="" />, errorElement: <ErrorElement /> },

      // ─── AUTOMATION FEATURE ROUTES ──────────────────────────────────────
      {
        path: 'automation',
        element: (
          <FeatureGuard feature="automation" fallback={<Navigate to="/app" replace />}>
            <AutomationPage />
          </FeatureGuard>
        ),
        errorElement: <ErrorElement />,
        children: [
          // Rules Management
          {
            path: 'rules',
            element: (
              <Suspense fallback={<RouteLoadingFallback />}>
                <LazyRuleList />
              </Suspense>
            ),
            errorElement: <ErrorElement />,
          },
          {
            path: 'rules/new',
            element: (
              <Suspense fallback={<RouteLoadingFallback />}>
                <RuleBuilderCreateWrapper />
              </Suspense>
            ),
            errorElement: <ErrorElement />,
          },
          {
            path: 'rules/:ruleId',
            element: (
              <Suspense fallback={<RouteLoadingFallback />}>
                <RuleBuilderEditWrapper />
              </Suspense>
            ),
            errorElement: <ErrorElement />,
          },
          {
            path: 'rules/:ruleId/logs',
            element: (
              <Suspense fallback={<RouteLoadingFallback />}>
                <ExecutionLogsWrapper />
              </Suspense>
            ),
            errorElement: <ErrorElement />,
          },

          // Template Management
          {
            path: 'templates',
            element: (
              <Suspense fallback={<RouteLoadingFallback />}>
                <LazyTemplateManager />
              </Suspense>
            ),
            errorElement: <ErrorElement />,
          },

          // Debugging Tools
          {
            path: 'debug',
            element: (
              <Suspense fallback={<RouteLoadingFallback />}>
                <LazyRuleDebugger />
              </Suspense>
            ),
            errorElement: <ErrorElement />,
          },
        ],
      },
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
