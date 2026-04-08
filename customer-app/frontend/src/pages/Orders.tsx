import { useEffect, useState } from 'react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch orders from API
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
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading your orders...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">You haven't placed any orders yet</p>
            <a
              href="/explore"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Explore Businesses
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{order.totalAmount}
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {order.notes && (
                  <p className="text-gray-600 mb-4">{order.notes}</p>
                )}

                <button className="text-blue-600 hover:text-blue-700 font-semibold">
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
