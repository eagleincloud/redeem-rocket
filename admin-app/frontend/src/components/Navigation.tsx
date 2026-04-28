import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Navigation() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            🚀 Redeem Rocket Admin
          </Link>

          <div className="flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">
              📊 Dashboard
            </Link>
            <Link to="/monitoring" className="text-gray-600 hover:text-gray-900 font-medium">
              🔍 Monitoring
            </Link>
            <Link to="/businesses" className="text-gray-600 hover:text-gray-900 font-medium">
              🏢 Businesses
            </Link>
            <Link to="/users" className="text-gray-600 hover:text-gray-900 font-medium">
              👥 Users
            </Link>
            <Link to="/reports" className="text-gray-600 hover:text-gray-900 font-medium">
              📈 Reports
            </Link>

            {user ? (
              <div className="flex items-center space-x-4 ml-8 pl-8 border-l border-gray-200">
                <span className="text-gray-700 text-sm">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  )
}
