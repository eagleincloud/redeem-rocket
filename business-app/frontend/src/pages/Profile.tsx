import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

export default function Profile() {
  const { user, logout } = useAuthStore()
  const [business, setBusiness] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchBusinessProfile()
  }, [])

  const fetchBusinessProfile = async () => {
    try {
      const response = await fetch('/api/v1/businesses/my_business/')
      if (response.ok) {
        const data = await response.json()
        setBusiness(data)
      }
    } catch (error) {
      console.error('Failed to fetch business profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8 border-b flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Logout
            </button>
          </div>

          <div className="px-6 py-8">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <p className="text-gray-900">{business?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <p className="text-gray-900">{business?.category}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{business?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <p className="text-gray-900">{business?.phone}</p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <p className="text-gray-900">
                  {business?.address}, {business?.city}, {business?.state} {business?.pincode}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Radius
                </label>
                <p className="text-gray-900">{business?.serviceRadius} km</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Status
                </label>
                <p className="text-gray-900 capitalize">{business?.verificationStatus}</p>
              </div>
            </div>

            {business?.description && (
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <p className="text-gray-900">{business.description}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Profile
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
                Change Password
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
