import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useCategoryStore } from './stores/categoryStore'
import Layout from './components/Layout'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Documents from './pages/Documents'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CategorySelection from './pages/CategorySelection'
import RedeeemRocketDashboard from './pages/RedeeemRocketDashboard'
import LeadManagementDashboard from './pages/LeadManagementDashboard'
// Feature Marketplace Pages
import { FeatureMarketplacePage } from './pages/FeatureMarketplace'
// Admin Pages
import { AdminFeatureManagement } from './admin/AdminFeatureManagement'
import { FeatureRequestQueue } from './admin/FeatureRequestQueue'
import { FeatureUsageStats } from './admin/FeatureUsageStats'

export default function App() {
  const { isAuthenticated, user } = useAuthStore()
  const { activeCategory } = useCategoryStore()

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    )
  }

  // Show category selection if no category selected
  if (!activeCategory) {
    return (
      <Router>
        <Routes>
          <Route path="/category-select" element={<CategorySelection />} />
          <Route path="*" element={<CategorySelection />} />
        </Routes>
      </Router>
    )
  }

  return (
    <Router>
      <Routes>
        {activeCategory === 'redeem-rocket' ? (
          <Route element={<Layout />}>
            <Route path="/" element={<RedeeemRocketDashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/features" element={<FeatureMarketplacePage businessId={user?.id || ''} businessType="ecommerce" userId={user?.id || ''} />} />
            <Route path="/profile" element={<Profile />} />
            {/* Admin Routes */}
            <Route path="/admin/features" element={<AdminFeatureManagement />} />
            <Route path="/admin/feature-requests" element={<FeatureRequestQueue />} />
            <Route path="/admin/analytics" element={<FeatureUsageStats features={[]} businessFeatureMap={new Map()} />} />
          </Route>
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<LeadManagementDashboard />} />
            {/* Growth Platform routes coming soon */}
            {/* <Route path="/leads" element={<Leads />} /> */}
            {/* <Route path="/leads/:id" element={<LeadDetail />} /> */}
            {/* <Route path="/leads/import" element={<LeadImport />} /> */}
            {/* <Route path="/email-campaigns" element={<EmailCampaigns />} /> */}
            {/* <Route path="/automation-rules" element={<AutomationRules />} /> */}
            {/* <Route path="/social-accounts" element={<SocialAccounts />} /> */}
            {/* <Route path="/lead-connectors" element={<LeadConnectors />} /> */}
            <Route path="/features" element={<FeatureMarketplacePage businessId={user?.id || ''} businessType="b2b" userId={user?.id || ''} />} />
            <Route path="/profile" element={<Profile />} />
            {/* Admin Routes */}
            <Route path="/admin/features" element={<AdminFeatureManagement />} />
            <Route path="/admin/feature-requests" element={<FeatureRequestQueue />} />
            <Route path="/admin/analytics" element={<FeatureUsageStats features={[]} businessFeatureMap={new Map()} />} />
          </Route>
        )}
      </Routes>
    </Router>
  )
}
