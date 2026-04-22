import { useState, memo } from 'react'

interface ScheduleData {
  sendAt: string
  sendImmediately: boolean
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'
  daysOfWeek?: number[]
}

const EmailScheduler = memo(function EmailScheduler({
  campaignId,
  onSave,
}: {
  campaignId: string
  onSave: (data: ScheduleData) => Promise<void>
}) {
  const [schedule, setSchedule] = useState<ScheduleData>({
    sendAt: '',
    sendImmediately: true,
    recurrence: 'none',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(schedule)
      setError(null)
      alert('Schedule saved successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule')
    } finally {
      setLoading(false)
    }
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Schedule Campaign</h2>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Send Immediately */}
        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={schedule.sendImmediately}
              onChange={(e) => setSchedule((prev) => ({ ...prev, sendImmediately: e.target.checked }))}
              className="rounded"
            />
            <span className="text-gray-700 font-medium">Send Immediately</span>
          </label>
        </div>

        {/* Scheduled Send */}
        {!schedule.sendImmediately && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send At</label>
            <input
              type="datetime-local"
              value={schedule.sendAt}
              onChange={(e) => setSchedule((prev) => ({ ...prev, sendAt: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Recurrence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recurrence</label>
          <select
            value={schedule.recurrence || 'none'}
            onChange={(e) =>
              setSchedule((prev) => ({
                ...prev,
                recurrence: e.target.value as ScheduleData['recurrence'],
              }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">No Recurrence</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Days of Week for Weekly */}
        {schedule.recurrence === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Send On</label>
            <div className="grid grid-cols-2 gap-2">
              {daysOfWeek.map((day, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(schedule.daysOfWeek || []).includes(idx)}
                    onChange={(e) => {
                      const days = schedule.daysOfWeek || []
                      if (e.target.checked) {
                        setSchedule((prev) => ({
                          ...prev,
                          daysOfWeek: [...days, idx],
                        }))
                      } else {
                        setSchedule((prev) => ({
                          ...prev,
                          daysOfWeek: days.filter((d) => d !== idx),
                        }))
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
        >
          {loading ? 'Saving...' : 'Save Schedule'}
        </button>
      </form>
    </div>
  )
})

export default EmailScheduler
