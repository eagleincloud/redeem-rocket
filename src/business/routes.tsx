import { createBrowserRouter } from 'react-router';
import { BusinessProvider } from './context/BusinessContext';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { BusinessLayout } from './components/BusinessLayout';
import { BusinessOnboarding } from './components/BusinessOnboarding';
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
import { BusinessNotificationsPage } from './components/BusinessNotificationsPage';
import { SubscriptionPage } from './components/SubscriptionPage';
import { MarketingPage } from './components/MarketingPage';
import { CampaignsPage } from './components/CampaignsPage';
import { InvoicesPage } from './components/InvoicesPage';
import { LeadsPage } from './components/LeadsPage';
import { OutreachPage } from './components/OutreachPage';
import { TeamPage } from './components/TeamPage';
import { RBACProvider } from './context/RBACContext';

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

function OnboardingRoot() {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <ErrorBoundary>
          <BusinessOnboarding />
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
  {
    path: '/onboarding',
    element: <OnboardingRoot />,
    errorElement: <ErrorElement />,
  },
  {
    path: '/app',
    element: <Root />,
    errorElement: <ErrorElement />,
    children: [
      { index: true, element: <DashboardPage />, errorElement: <ErrorElement /> },
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
      { path: 'notifications', element: <BusinessNotificationsPage />, errorElement: <ErrorElement /> },
      { path: 'subscription',  element: <SubscriptionPage />, errorElement: <ErrorElement /> },
      { path: 'marketing',     element: <MarketingPage />, errorElement: <ErrorElement /> },
      { path: 'campaigns',     element: <CampaignsPage />, errorElement: <ErrorElement /> },
      { path: 'invoices',      element: <InvoicesPage />, errorElement: <ErrorElement /> },
      { path: 'leads',         element: <LeadsPage />, errorElement: <ErrorElement /> },
      { path: 'outreach',      element: <OutreachPage />, errorElement: <ErrorElement /> },
      { path: 'team',          element: <TeamPage />, errorElement: <ErrorElement /> },
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
