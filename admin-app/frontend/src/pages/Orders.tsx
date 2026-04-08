import { useEffect, useState } from 'react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/v1/admin/orders/')
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Order Management</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6">Order ID</th>
                <th className="text-left py-4 px-6">Customer</th>
                <th className="text-left py-4 px-6">Business</th>
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
                  <td className="py-4 px-6">{order.businessName}</td>
                  <td className="py-4 px-6 font-semibold">₹{order.totalAmount}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded text-sm capitalize ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <button className="text-blue-600 hover:text-blue-700">View Details</button>
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
