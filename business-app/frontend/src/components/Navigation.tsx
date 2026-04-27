import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useCategoryStore } from '../stores/categoryStore'

interface FeaturePreferences {
  product_catalog?: boolean;
  lead_management?: boolean;
  email_campaigns?: boolean;
  automation?: boolean;
  social_media?: boolean;
}

export default function Navigation() {
  const { user, logout } = useAuthStore()
  const { activeCategory, setActiveCategory } = useCategoryStore()
  const navigate = useNavigate()
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get feature preferences from user data or localStorage
  const featurePreferences = useMemo<FeaturePreferences>(() => {
    try {
      const bizUserStr = localStorage.getItem('biz_user')
      if (bizUserStr) {
        const bizUser = JSON.parse(bizUserStr)
        return bizUser.feature_preferences || {}
      }
    } catch (e) {
      console.error('Failed to parse biz_user from localStorage:', e)
    }
    return {}
  }, [])

  const canAccessFeature = (feature: keyof FeaturePreferences): boolean => {
    if (featurePreferences[feature] === undefined) return true // Default to true if not set
    return featurePreferences[feature] === true
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitchCategory = (category: 'redeem-rocket' | 'lead-management') => {
    setActiveCategory(category)
    setShowCategoryMenu(false)
    navigate('/')
  }

  const getCategoryLabel = () => {
    if (activeCategory === 'redeem-rocket') return '🚀 Redeem Rocket'
    if (activeCategory === 'lead-management') return '👥 Lead Management'
    return 'Select Category'
  }

  const getCategoryNavLinks = () => {
    if (activeCategory === 'redeem-rocket') {
      return (
        <>
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          {canAccessFeature('product_catalog') && (
            <>
              <Link to="/orders" className="text-gray-600 hover:text-gray-900">
                Orders
              </Link>
              <Link to="/documents" className="text-gray-600 hover:text-gray-900">
                Documents
              </Link>
            </>
          )}
          <Link to="/features" className="text-blue-600 hover:text-blue-700 font-bold">
            🎯 Features
          </Link>
        </>
      )
    }
    if (activeCategory === 'lead-management') {
      return (
        <>
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          {canAccessFeature('lead_management') && (
            <Link to="/leads" className="text-gray-600 hover:text-gray-900">
              Leads
            </Link>
          )}
          {canAccessFeature('email_campaigns') && (
            <Link to="/email-campaigns" className="text-gray-600 hover:text-gray-900">
              Campaigns
            </Link>
          )}
          {canAccessFeature('automation') && (
            <Link to="/automation-rules" className="text-gray-600 hover:text-gray-900">
              Automation
            </Link>
          )}
          {canAccessFeature('social_media') && (
            <>
              <Link to="/social-accounts" className="text-gray-600 hover:text-gray-900">
                Social
              </Link>
              <Link to="/lead-connectors" className="text-gray-600 hover:text-gray-900">
                Connectors
              </Link>
            </>
          )}
          <Link to="/features" className="text-blue-600 hover:text-blue-700 font-bold">
            🎯 Features
          </Link>
        </>
      )
    }
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-600">
            Redeem Rocket
          </Link>

          {/* Hamburger menu button for mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Category Switcher */}
            {activeCategory && (
              <div className="relative">
                <button
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                >
                  <span className="text-gray-700 font-medium">{getCategoryLabel()}</span>
                  <span className="text-xs">⇅</span>
                </button>
                {showCategoryMenu && (
                  <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                    <button
                      onClick={() => handleSwitchCategory('redeem-rocket')}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition border-b border-gray-200 ${
                        activeCategory === 'redeem-rocket' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="text-lg font-bold text-gray-900">🚀 Redeem Rocket</div>
                      <div className="text-xs text-gray-600 mt-1">Business Operations</div>
                    </button>
                    <button
                      onClick={() => handleSwitchCategory('lead-management')}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition ${
                        activeCategory === 'lead-management' ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="text-lg font-bold text-gray-900">👥 Lead Management</div>
                      <div className="text-xs text-gray-600 mt-1">Growth Platform</div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Category-specific links */}
            {getCategoryNavLinks()}

            {user ? (
              <div className="flex items-center space-x-4 ml-8 border-l border-gray-200 pl-8">
                <span className="text-gray-700 text-sm">
                  {user.firstName} {user.lastName}
                </span>
                <Link to="/profile" className="text-blue-600 hover:text-blue-700 text-sm">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 space-y-4">
            {/* Category Switcher Mobile */}
            {activeCategory && (
              <>
                <div className="px-2 text-sm font-semibold text-gray-900">
                  {getCategoryLabel()}
                </div>
                <div className="space-y-2 px-2">
                  <button
                    onClick={() => {
                      handleSwitchCategory('redeem-rocket')
                      setMobileMenuOpen(false)
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                      activeCategory === 'redeem-rocket'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    🚀 Redeem Rocket
                  </button>
                  <button
                    onClick={() => {
                      handleSwitchCategory('lead-management')
                      setMobileMenuOpen(false)
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                      activeCategory === 'lead-management'
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    👥 Lead Management
                  </button>
                </div>
                <div className="border-t border-gray-200"></div>
              </>
            )}

            {/* Category links */}
            <div className="space-y-2 px-2">
              {activeCategory === 'redeem-rocket' ? (
                <>
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-gray-600 hover:text-gray-900 py-2"
                  >
                    Dashboard
                  </Link>
                  {canAccessFeature('product_catalog') && (
                    <>
                      <Link
                        to="/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-gray-600 hover:text-gray-900 py-2"
                      >
                        Orders
                      </Link>
                      <Link
                        to="/documents"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-gray-600 hover:text-gray-900 py-2"
                      >
                        Documents
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-gray-600 hover:text-gray-900 py-2"
                  >
                    Dashboard
                  </Link>
                  {canAccessFeature('lead_management') && (
                    <Link
                      to="/leads"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-gray-600 hover:text-gray-900 py-2"
                    >
                      Leads
                    </Link>
                  )}
                  {canAccessFeature('email_campaigns') && (
                    <Link
                      to="/email-campaigns"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-gray-600 hover:text-gray-900 py-2"
                    >
                      Campaigns
                    </Link>
                  )}
                  {canAccessFeature('automation') && (
                    <Link
                      to="/automation-rules"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-gray-600 hover:text-gray-900 py-2"
                    >
                      Automation
                    </Link>
                  )}
                  {canAccessFeature('social_media') && (
                    <>
                      <Link
                        to="/social-accounts"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-gray-600 hover:text-gray-900 py-2"
                      >
                        Social
                      </Link>
                      <Link
                        to="/lead-connectors"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-gray-600 hover:text-gray-900 py-2"
                      >
                        Connectors
                      </Link>
                    </>
                  )}
                </>
              )}
              <Link
                to="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-blue-600 hover:text-blue-700 py-2 font-medium"
              >
                🎯 Features
              </Link>
            </div>

            {/* User menu */}
            <div className="border-t border-gray-200 pt-4 px-2">
              {user ? (
                <>
                  <div className="text-gray-700 text-sm mb-3 font-medium">{user.firstName} {user.lastName}</div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-blue-600 hover:text-blue-700 text-sm py-2"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left text-red-600 hover:text-red-700 text-sm py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-gray-600 hover:text-gray-900 text-sm py-2"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
