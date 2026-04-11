import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 font-semibold"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{user.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <p className="text-gray-900">{user.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <p className="text-gray-900">{user.lastName}</p>
                </div>
              </div>

              {user.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <p className="text-gray-900">{user.phone}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <p className="text-gray-900 capitalize">{user.role.replace('_', ' ')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Verified
                </label>
                <p className="text-gray-900">
                  {user.isVerified ? '✓ Yes' : '✗ No'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Profile
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
