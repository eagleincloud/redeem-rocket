import { useEffect, useState } from 'react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/v1/orders/')
        if (response.ok) {
          const data = await response.json()
          setOrders(data.results || data)
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Orders Management</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold">Order ID</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold hidden sm:table-cell">Customer</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold">Amount</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold">Status</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold hidden lg:table-cell">Date</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold hidden sm:table-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold">{order.id.slice(0, 8)}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm hidden sm:table-cell">{order.customerName}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-semibold">₹{order.totalAmount}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          // Handle status update
                        }}
                        className="px-2 sm:px-3 py-1 rounded border border-gray-300 text-xs sm:text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm hidden lg:table-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 hidden sm:table-cell">
                      <button className="text-blue-600 hover:text-blue-700 font-semibold text-xs sm:text-sm">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
