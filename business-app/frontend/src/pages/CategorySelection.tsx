import { useNavigate } from 'react-router-dom'
import { useCategoryStore } from '../stores/categoryStore'

export default function CategorySelection() {
  const navigate = useNavigate()
  const { setActiveCategory } = useCategoryStore()

  const handleSelectCategory = (category: 'redeem-rocket' | 'lead-management') => {
    setActiveCategory(category)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Welcome to Redeem Rocket</h1>
          <p className="text-xl text-gray-300">Select your focus area to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Redeem Rocket Card */}
          <button
            onClick={() => handleSelectCategory('redeem-rocket')}
            className="group relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-left hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
          >
            <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="relative z-10">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-3xl font-bold text-white mb-3">Redeem Rocket</h2>
              <p className="text-blue-100 text-lg mb-6">Business Operations</p>
              <div className="space-y-2 text-blue-50 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <span>Orders & Revenue Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📦</span>
                  <span>Manage Orders & Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <span>Business Documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <span>Business Profile Settings</span>
                </div>
              </div>
            </div>
          </button>

          {/* Lead Management Card */}
          <button
            onClick={() => handleSelectCategory('lead-management')}
            className="group relative bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 text-left hover:from-purple-500 hover:to-purple-600 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
          >
            <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="relative z-10">
              <div className="text-6xl mb-4">👥</div>
              <h2 className="text-3xl font-bold text-white mb-3">Lead Management</h2>
              <p className="text-purple-100 text-lg mb-6">Growth Platform</p>
              <div className="space-y-2 text-purple-50 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👥</span>
                  <span>Manage Sales Leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📧</span>
                  <span>Email Campaigns & Sequences</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span>Automation & Workflows</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📱</span>
                  <span>Social Media & Lead Sources</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="text-center mt-12 text-gray-400">
          <p className="text-sm">You can switch categories anytime from the sidebar menu</p>
        </div>
      </div>
    </div>
  )
}
