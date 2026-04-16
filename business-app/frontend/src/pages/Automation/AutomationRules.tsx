import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAutomation } from '../../hooks/useAutomation'

export default function AutomationRules() {
  const navigate = useNavigate()
  const { rules, loading, error, fetchRules, deleteRule, updateRule } = useAutomation()
  const [filterTrigger, setFilterTrigger] = useState<string>('all')

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const filtered = filterTrigger === 'all' ? rules : rules.filter((r) => r.trigger_type === filterTrigger)

  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.is_active).length,
    triggered: rules.reduce((sum, r) => sum + r.run_count, 0),
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Automation Rules</h1>
            <p className="text-gray-600 mt-2">Create workflows to automate lead management</p>
          </div>
          <button
            onClick={() => navigate('/automation-rules/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Rule
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Rules', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Triggered', value: stats.triggered },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-6">{error}</div>}

        {/* List */}
        {loading ? (
          <p className="text-center text-gray-500">Loading rules...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No rules found</p>
            <button
              onClick={() => navigate('/automation-rules/new')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first rule
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((rule) => (
              <div key={rule.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.rule_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Trigger: <span className="font-medium">{rule.trigger_type}</span> → Action:{' '}
                      <span className="font-medium">{rule.action_type}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Triggered {rule.run_count} times
                      {rule.last_run_at && ` • Last run: ${new Date(rule.last_run_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateRule(rule.id, { is_active: !rule.is_active })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        rule.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => navigate(`/automation-rules/${rule.id}`)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this rule?')) {
                          await deleteRule(rule.id)
                          await fetchRules()
                        }
                      }}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
