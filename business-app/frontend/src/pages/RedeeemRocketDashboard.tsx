import { useNavigate } from 'react-router-dom'

export default function RedeeemRocketDashboard() {
  const navigate = useNavigate()

  const stats = { totalOrders: 1234, totalRevenue: 125450, pendingOrders: 23, lastMonthRevenue: 98320 }
  const recentOrders = [
    { id: 'ORD-001', customer: 'John Doe', amount: 1250, status: 'Delivered', date: '2 hours ago' },
    { id: 'ORD-002', customer: 'Jane Smith', amount: 850, status: 'In Transit', date: '5 hours ago' },
    { id: 'ORD-003', customer: 'Bob Wilson', amount: 2100, status: 'Processing', date: 'Yesterday' },
    { id: 'ORD-004', customer: 'Alice Brown', amount: 1550, status: 'Pending', date: '2 days ago' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">🚀 Redeem Rocket Dashboard</h1>
          <p className="text-gray-600 mt-2">Business Operations & Revenue Management</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders.toLocaleString()}</p>
            <p className="text-green-600 text-sm mt-4">+12% from last month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">${(stats.totalRevenue / 1000).toFixed(1)}K</p>
            <p className="text-green-600 text-sm mt-4">+8% from last month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Pending Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingOrders}</p>
            <p className="text-orange-600 text-sm mt-4">Action needed</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Last Month</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">${(stats.lastMonthRevenue / 1000).toFixed(1)}K</p>
            <p className="text-purple-600 text-sm mt-4">Previous period</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <button onClick={() => navigate('/orders')} className="text-blue-600 hover:text-blue-700 font-medium text-sm">View All →</button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.customer}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${order.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm"><span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : order.status === 'In Transit' ? 'bg-blue-100 text-blue-800' : order.status === 'Processing' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>{order.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <button onClick={() => navigate('/orders')} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-bold text-gray-900">Manage Orders</h3>
            <p className="text-gray-600 text-sm mt-1">View, manage, and track all orders</p>
          </button>
          <button onClick={() => navigate('/documents')} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <div className="text-3xl mb-3">📄</div>
            <h3 className="font-bold text-gray-900">Documents</h3>
            <p className="text-gray-600 text-sm mt-1">Manage business documents and files</p>
          </button>
          <button onClick={() => navigate('/profile')} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="font-bold text-gray-900">Profile</h3>
            <p className="text-gray-600 text-sm mt-1">Update your business profile</p>
          </button>
        </div>
      </div>
    </div>
  )
}
