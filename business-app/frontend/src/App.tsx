import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Documents from './pages/Documents'
import Login from './pages/Login'
import Signup from './pages/Signup'
// Growth Platform Pages
import Leads from './pages/Leads/Leads'
import LeadDetail from './pages/Leads/LeadDetail'
import LeadImport from './pages/Leads/LeadImport'
import EmailCampaigns from './pages/EmailCampaigns/EmailCampaigns'
import AutomationRules from './pages/Automation/AutomationRules'
import SocialAccounts from './pages/SocialMedia/SocialAccounts'
import LeadConnectors from './pages/LeadConnectors/LeadConnectors'

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Login />} />
          </>
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/profile" element={<Profile />} />
            {/* Growth Platform Routes */}
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/leads/import" element={<LeadImport />} />
            <Route path="/email-campaigns" element={<EmailCampaigns />} />
            <Route path="/automation-rules" element={<AutomationRules />} />
            <Route path="/social-accounts" element={<SocialAccounts />} />
            <Route path="/lead-connectors" element={<LeadConnectors />} />
          </Route>
        )}
      </Routes>
    </Router>
  )
}
