import { useEffect, useState } from 'react'

export default function Businesses() {
  const [businesses, setBusinesses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBusinesses()
  }, [])

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/v1/admin/businesses/')
      if (response.ok) {
        const data = await response.json()
        setBusinesses(data.results || data)
      }
    } catch (error) {
      console.error('Failed to fetch businesses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const approveBusinessh = async (id: string) => {
    try {
      await fetch(`/api/v1/admin/businesses/${id}/approve/`, {
        method: 'POST',
      })
      await fetchBusinesses()
    } catch (error) {
      console.error('Failed to approve business:', error)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Business Management</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6">Business</th>
                <th className="text-left py-4 px-6">Owner</th>
                <th className="text-left py-4 px-6">Category</th>
                <th className="text-left py-4 px-6">Status</th>
                <th className="text-left py-4 px-6">Verification</th>
                <th className="text-left py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business: any) => (
                <tr key={business.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-semibold">{business.name}</td>
                  <td className="py-4 px-6">{business.ownerName}</td>
                  <td className="py-4 px-6">{business.category}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        business.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {business.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded text-sm capitalize ${
                        business.verificationStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : business.verificationStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {business.verificationStatus}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {business.verificationStatus === 'pending' && (
                      <button
                        onClick={() => approveBusinessh(business.id)}
                        className="text-green-600 hover:text-green-700 mr-4 font-semibold"
                      >
                        Approve
                      </button>
                    )}
                    <button className="text-blue-600 hover:text-blue-700 mr-4">View</button>
                    <button className="text-red-600 hover:text-red-700">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
