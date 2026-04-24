import { createBrowserRouter, Navigate }  from 'react-router-dom';
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { ExplorePage } from "./components/ExplorePage";
import { AuctionsPage } from "./components/AuctionsPage";
import { CustomerRequirementPage } from "./components/CustomerRequirementPage";
import { WalletPage } from "./components/WalletPage";
import { NearbyDealsPage } from "./components/NearbyDealsPage";
import { ProfilePage } from "./components/ProfilePage";
import { LoginPage } from "./components/LoginPage";
import { BusinessDashboard } from "./components/BusinessDashboard";
import { BusinessPage } from "./components/BusinessPage";
import { OrdersPage } from "./components/OrdersPage";
import { ScrapedBusinessesPage } from "./components/ScrapedBusinessesPage";
import { NotFound } from "./components/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Wrap each route with error boundary
const withErrorBoundary = (Component: any) => () => (
  <ErrorBoundary>
    <Component />
  </ErrorBoundary>
);
import { AdminPanel } from "./components/AdminPanel";
import { NotificationsPage } from "./components/NotificationsPage";
import { EmailVerificationPage } from "./components/EmailVerificationPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: withErrorBoundary(LoginPage),
  },
  {
    path: "/verify-email",
    Component: EmailVerificationPage,
  },
  {
    path: "/onboarding",
    Component: () => <Navigate to="/business/onboarding" replace />,
  },
  {
    path: "/",
    Component: withErrorBoundary(Root),
    children: [
      { index: true, Component: Home },
      { path: "explore", Component: ExplorePage },
      { path: "auctions", Component: AuctionsPage },
      { path: "requirements", Component: CustomerRequirementPage },
      { path: "wallet", Component: WalletPage },
      { path: "nearby-deals", Component: NearbyDealsPage },
      { path: "profile", Component: ProfilePage },
      { path: "orders", Component: OrdersPage },
      { path: "notifications", Component: NotificationsPage },
      { path: "scraped-businesses", Component: ScrapedBusinessesPage },
      { path: "business", Component: BusinessDashboard },
      { path: "business/:id", Component: BusinessPage },
      { path: "admin", Component: AdminPanel },
      { path: "*", Component: NotFound },
    ],
  },
]);