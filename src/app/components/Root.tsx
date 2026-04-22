import { Outlet, useNavigate }  from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '../constants';
import { SearchCategoryProvider } from '../context/SearchCategoryContext';
import { CartProvider } from '../context/CartContext';
import { WalletProvider } from '../context/WalletContext';
import { OrdersProvider } from '../context/OrdersContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AppHeader, APP_HEADER_HEIGHT } from './AppHeader';
import { CircularFABMenu } from './CircularFABMenu';
import { BottomDock } from './BottomDock';
import { ExploreSheet } from './ExploreSheet';
import { FeatureGuide } from './FeatureGuide';
import { OfferSlotsPanel } from './OfferSlotsPanel';
import { PayNowFlow } from './PayNowFlow';
import { useGeofenceAlerts } from '../hooks/useGeofenceAlerts';
import type { Business } from '../types';

// Inner shell — runs inside all providers so hooks can access context
function AppShell({
  exploreOpen, setExploreOpen, navTarget, showGuide, handleGuideDismiss,
}: {
  exploreOpen: boolean;
  setExploreOpen: (v: boolean) => void;
  navTarget: Business | null;
  showGuide: boolean;
  handleGuideDismiss: () => void;
}) {
  // Geofence alerts — must be inside SearchCategoryProvider
  useGeofenceAlerts();

  const [payNowBiz, setPayNowBiz] = useState<Business | null>(null);

  // Listen for Pay Now trigger from MapBusinessPopup
  useEffect(() => {
    const handler = (e: Event) => {
      const biz = (e as CustomEvent<Business>).detail;
      if (biz) setPayNowBiz(biz);
    };
    window.addEventListener('geo:paynow', handler);
    return () => window.removeEventListener('geo:paynow', handler);
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <AppHeader />
      <main
        className="flex-1 min-h-0 overflow-auto flex flex-col"
        style={{ paddingTop: APP_HEADER_HEIGHT }}
      >
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </main>
      <CircularFABMenu onExplore={() => setExploreOpen(true)} />
      <OfferSlotsPanel />
      <BottomDock onOpen={() => setExploreOpen(true)} />
      <ExploreSheet isOpen={exploreOpen} onClose={() => setExploreOpen(false)} activeNavTarget={navTarget} />
      {showGuide && <FeatureGuide onDismiss={handleGuideDismiss} />}
      {payNowBiz && (
        <PayNowFlow preFilled={payNowBiz} onClose={() => setPayNowBiz(null)} />
      )}
    </div>
  );
}

// ── Dev bypass ───────────────────────────────────────────────────────────────
// Set DEV_BYPASS = true to skip login while building features.
// Flip back to false when ready to enable real authentication.
const DEV_BYPASS = true;

const DEV_CUSTOMER = {
  id:         'dev-customer-1',
  name:       'Dev Customer',
  email:      'dev@customer.in',
  phone:      '9888888888',
  role:       'customer' as const,
  avatar:     'https://api.dicebear.com/7.x/initials/svg?seed=Dev',
};

export function Root() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(DEV_BYPASS);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [navTarget, setNavTarget] = useState<Business | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Listen for navigation target broadcasts from Home.tsx
  useEffect(() => {
    const handler = (e: Event) => {
      setNavTarget((e as CustomEvent<Business | null>).detail);
    };
    window.addEventListener('geo:navtarget', handler);
    return () => window.removeEventListener('geo:navtarget', handler);
  }, []);

  // Listen for replay-guide event dispatched from ProfilePage
  useEffect(() => {
    const handler = () => setShowGuide(true);
    window.addEventListener('geo:replay_feature_guide', handler);
    return () => window.removeEventListener('geo:replay_feature_guide', handler);
  }, []);

  useEffect(() => {
    if (DEV_BYPASS) {
      // Inject a static dev user so any component reading localStorage('user') works
      if (!localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(DEV_CUSTOMER));
      }
      localStorage.setItem('geo:onboarding_done', '1');
      setIsLoggedIn(true);
      return;
    }
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    } else {
      // If onboarding hasn't been completed yet, redirect there
      const onboardingDone = localStorage.getItem('geo:onboarding_done');
      const parsedUser = JSON.parse(user);
      if (!onboardingDone && parsedUser.role !== 'business') {
        navigate('/onboarding');
      } else {
        setIsLoggedIn(true);
        // Show feature guide if triggered by onboarding completion
        if (
          localStorage.getItem('geo:show_feature_guide') === '1' &&
          localStorage.getItem('geo:feature_guide_done') !== '1'
        ) {
          setShowGuide(true);
        }
      }
    }
  }, [navigate]);

  const handleGuideDismiss = useCallback(() => {
    localStorage.removeItem('geo:show_feature_guide');
    localStorage.setItem('geo:feature_guide_done', '1');
    setShowGuide(false);
  }, []);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <ThemeProvider>
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <SearchCategoryProvider>
        <CartProvider>
          <WalletProvider>
          <OrdersProvider>
            <AppShell
              exploreOpen={exploreOpen}
              setExploreOpen={setExploreOpen}
              navTarget={navTarget}
              showGuide={showGuide}
              handleGuideDismiss={handleGuideDismiss}
            />
          </OrdersProvider>
          </WalletProvider>
          </CartProvider>
      </SearchCategoryProvider>
    </APIProvider>
    </ThemeProvider>
  );
}