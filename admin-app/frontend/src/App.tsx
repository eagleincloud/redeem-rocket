import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Businesses from './pages/Businesses'
import Orders from './pages/Orders'
import Reports from './pages/Reports'
import Login from './pages/Login'

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Login />} />
          </>
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        )}
      </Routes>
    </Router>
  )
}
