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
            🚀 Redeem Rocket
          </Link>

          <div className="flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link to="/explore" className="text-gray-600 hover:text-gray-900">
              Explore
            </Link>
            <Link to="/orders" className="text-gray-600 hover:text-gray-900">
              Orders
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
                <Link to="/profile" className="text-blue-600 hover:text-blue-700">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-gray-900">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
