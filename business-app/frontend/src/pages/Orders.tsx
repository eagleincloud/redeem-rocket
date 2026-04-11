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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Orders Management</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6">Order ID</th>
                <th className="text-left py-4 px-6">Customer</th>
                <th className="text-left py-4 px-6">Amount</th>
                <th className="text-left py-4 px-6">Status</th>
                <th className="text-left py-4 px-6">Date</th>
                <th className="text-left py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-semibold">{order.id.slice(0, 8)}</td>
                  <td className="py-4 px-6">{order.customerName}</td>
                  <td className="py-4 px-6">₹{order.totalAmount}</td>
                  <td className="py-4 px-6">
                    <select
                      value={order.status}
                      onChange={(e) => {
                        // Handle status update
                      }}
                      className="px-3 py-1 rounded border border-gray-300"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-4 px-6">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <button className="text-blue-600 hover:text-blue-700 font-semibold">
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
  )
}
