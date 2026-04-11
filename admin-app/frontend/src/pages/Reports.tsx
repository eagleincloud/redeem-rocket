import { useEffect, useState } from 'react'

export default function Reports() {
  const [reports, setReports] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    monthlyGrowth: 0,
    topBusinesses: [],
    revenueByCategory: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/v1/admin/reports/')
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Reports & Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-green-600">₹{reports.totalRevenue}</div>
            <p className="text-sm text-gray-500 mt-2">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Transactions</div>
            <div className="text-3xl font-bold text-gray-900">{reports.totalTransactions}</div>
            <p className="text-sm text-gray-500 mt-2">Orders processed</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Average Order Value</div>
            <div className="text-3xl font-bold text-blue-600">₹{reports.averageOrderValue}</div>
            <p className="text-sm text-gray-500 mt-2">Per transaction</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Monthly Growth</div>
            <div className="text-3xl font-bold text-yellow-600">+{reports.monthlyGrowth}%</div>
            <p className="text-sm text-gray-500 mt-2">Last month</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Businesses</h2>
            <div className="space-y-3">
              {reports.topBusinesses.map((business: any, index: number) => (
                <div key={index} className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-700">{business.name}</span>
                  <span className="font-semibold text-gray-900">₹{business.revenue}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Revenue by Category</h2>
            <div className="space-y-3">
              {reports.revenueByCategory.map((category: any, index: number) => (
                <div key={index} className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-700">{category.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded">
                      <div
                        className="h-full bg-blue-600 rounded"
                        style={{ width: `${(category.percentage || 0)}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-gray-900 min-w-12">
                      {category.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
