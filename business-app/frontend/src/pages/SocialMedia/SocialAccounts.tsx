import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocialMedia } from '../../hooks/useSocialMedia'

const PLATFORMS = [
  { name: 'Twitter', icon: '𝕏', color: 'bg-black text-white' },
  { name: 'Facebook', icon: 'f', color: 'bg-blue-600 text-white' },
  { name: 'LinkedIn', icon: 'in', color: 'bg-blue-700 text-white' },
  { name: 'Instagram', icon: '📷', color: 'bg-pink-500 text-white' },
  { name: 'TikTok', icon: '♪', color: 'bg-black text-white' },
]

export default function SocialAccounts() {
  const navigate = useNavigate()
  const { accounts, loading, error, fetchAccounts, deleteAccount } = useSocialMedia()

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Social Media Accounts</h1>
          <p className="text-gray-600 mt-2">Connect your social media accounts to publish posts</p>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-6">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PLATFORMS.map((platform) => {
            const account = accounts.find((a) => a.platform.toLowerCase() === platform.name.toLowerCase())

            return (
              <div key={platform.name} className="bg-white rounded-lg shadow overflow-hidden">
                <div className={`${platform.color} px-6 py-4 flex items-center gap-3`}>
                  <div className="text-2xl">{platform.icon}</div>
                  <h3 className="text-lg font-semibold">{platform.name}</h3>
                </div>

                <div className="p-6">
                  {account ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Account</p>
                        <p className="text-lg font-semibold text-gray-900">{account.account_name}</p>
                      </div>
                      {account.followers_count && (
                        <div>
                          <p className="text-sm text-gray-600">Followers</p>
                          <p className="text-lg font-semibold text-gray-900">{account.followers_count.toLocaleString()}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Reconnect logic
                            alert('Reconnect functionality would open OAuth flow')
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Reconnect
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Disconnect this account?')) {
                              await deleteAccount(account.id)
                              await fetchAccounts()
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">Not connected</p>
                      <button
                        onClick={() => {
                          // OAuth connection logic
                          alert(`Connect ${platform.name} account using OAuth`)
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Connect Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {!loading && accounts.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => navigate('/social-compose')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create Post
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
