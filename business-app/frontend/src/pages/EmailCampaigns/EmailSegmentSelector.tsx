import { useState, useEffect, memo } from 'react'

interface Segment {
  id: string
  name: string
  recipientCount: number
  criteria: Record<string, any>
  isActive: boolean
}

const EmailSegmentSelector = memo(function EmailSegmentSelector({
  onSelect,
  selectedSegmentId,
}: {
  onSelect: (segmentId: string) => void
  selectedSegmentId?: string
}) {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newSegment, setNewSegment] = useState({
    name: '',
    criteria: {} as Record<string, any>,
  })

  useEffect(() => {
    const fetchSegments = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/segments')
        if (!response.ok) throw new Error('Failed to fetch segments')
        const data = await response.json()
        setSegments(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load segments')
      } finally {
        setLoading(false)
      }
    }

    fetchSegments()
  }, [])

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newSegment.name.trim()) {
      alert('Please enter a segment name')
      return
    }

    try {
      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSegment),
      })

      if (!response.ok) throw new Error('Failed to create segment')

      const created = await response.json()
      setSegments((prev) => [...prev, created])
      onSelect(created.id)
      setShowCreate(false)
      setNewSegment({ name: '', criteria: {} })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create segment')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Loading segments...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Select Segment</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showCreate ? 'Cancel' : '+ New Segment'}
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">{error}</div>}

      {showCreate && (
        <form onSubmit={handleCreateSegment} className="mb-6 pb-6 border-b">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Segment Name</label>
            <input
              type="text"
              value={newSegment.name}
              onChange={(e) =>
                setNewSegment((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., High-Value Customers"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create Segment
            </button>
          </div>
        </form>
      )}

      {segments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No segments found</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first segment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {segments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => onSelect(segment.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${
                selectedSegmentId === segment.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{segment.name}</h3>
                  <p className="text-sm text-gray-600">
                    {segment.recipientCount.toLocaleString()} recipients
                  </p>
                </div>
                {segment.isActive && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

export default EmailSegmentSelector
