import { useEffect, useState } from 'react'

export default function Users() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/v1/admin/users/')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.results || data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">User Management</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6">User ID</th>
                <th className="text-left py-4 px-6">Name</th>
                <th className="text-left py-4 px-6">Email</th>
                <th className="text-left py-4 px-6">Role</th>
                <th className="text-left py-4 px-6">Status</th>
                <th className="text-left py-4 px-6">Joined</th>
                <th className="text-left py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6">{user.id.slice(0, 8)}</td>
                  <td className="py-4 px-6">{user.firstName} {user.lastName}</td>
                  <td className="py-4 px-6">{user.email}</td>
                  <td className="py-4 px-6 capitalize">{user.role.replace('_', ' ')}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <button className="text-blue-600 hover:text-blue-700 mr-4">Edit</button>
                    <button className="text-red-600 hover:text-red-700">Disable</button>
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
