import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    recentOrders: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch dashboard stats from API
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/businesses/my_business/')
        if (response.ok) {
          const data = await response.json()
          // Process data to generate stats
          setStats({
            totalOrders: data.orders?.length || 0,
            totalRevenue: data.totalRevenue || 0,
            pendingOrders: data.orders?.filter((o: any) => o.status === 'pending').length || 0,
            recentOrders: data.orders?.slice(0, 5) || [],
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Business Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Orders</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-green-600">₹{stats.totalRevenue}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Pending Orders</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Profile Status</div>
            <div className="text-lg font-semibold text-blue-600">Active</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-gray-600">No recent orders</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Order ID</th>
                    <th className="text-left py-3 px-4">Customer</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{order.id.slice(0, 8)}</td>
                      <td className="py-3 px-4">{order.customerName}</td>
                      <td className="py-3 px-4 font-semibold">₹{order.totalAmount}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
