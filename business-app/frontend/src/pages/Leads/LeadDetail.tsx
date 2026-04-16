import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLeads } from '../../hooks/useLeads'
import type { Lead } from '../../types/growth-platform'

const STAGE_OPTIONS: Lead['stage'][] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const PRIORITY_OPTIONS: Lead['priority'][] = ['low', 'medium', 'high', 'urgent']
const SOURCE_OPTIONS: Lead['source'][] = ['manual', 'csv', 'scrape', 'campaign', 'referral', 'walk_in', 'website']

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { loading, error, getLead, updateLead, deleteLead } = useLeads()
  const [lead, setLead] = useState<Lead | null>(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Lead>>({})
  const [saveLoading, setSaveLoading] = useState(false)
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (id) {
      loadLead()
    }
  }, [id])

  const loadLead = async () => {
    if (!id) return
    const data = await getLead(id)
    if (data) {
      setLead(data)
      setFormData(data)
    }
  }

  const handleFieldChange = (field: keyof Lead, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!id || !lead) return
    setSaveLoading(true)
    const result = await updateLead(id, formData)
    setSaveLoading(false)
    if (result) {
      setLead(result)
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('Delete this lead?')) return
    const success = await deleteLead(id)
    if (success) {
      navigate('/leads')
    }
  }

  const handleAddTag = () => {
    if (!newTag.trim()) return
    const tags = (formData.tags || []).concat(newTag.trim())
    setFormData((prev) => ({ ...prev, tags }))
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tag),
    }))
  }

  const handleWon = async () => {
    if (!id || !lead) return
    await updateLead(id, {
      stage: 'won',
      won_at: new Date().toISOString(),
    })
    await loadLead()
  }

  const handleLost = async () => {
    if (!id || !lead) return
    const reason = prompt('Enter reason for loss:')
    if (reason !== null) {
      await updateLead(id, {
        stage: 'lost',
        lost_at: new Date().toISOString(),
        lost_reason: reason,
      })
      await loadLead()
    }
  }

  if (loading && !lead) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-red-600">Lead not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/leads')}
              className="text-blue-600 hover:text-blue-700 mb-2"
            >
              ← Back to Leads
            </button>
            <h1 className="text-4xl font-bold text-gray-900">{lead.name}</h1>
          </div>
          <div className="flex gap-2">
            {!editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </>
            )}
            {editing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saveLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData(lead)
                  }}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-6">{error}</div>}

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    {editing ? (
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <p className="text-gray-900">{lead.email || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <p className="text-gray-900">{lead.phone || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.company || ''}
                        onChange={(e) => handleFieldChange('company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <p className="text-gray-900">{lead.company || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Interest</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.product_interest || ''}
                        onChange={(e) => handleFieldChange('product_interest', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <p className="text-gray-900">{lead.product_interest || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sales Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                    {editing ? (
                      <select
                        value={formData.stage || 'new'}
                        onChange={(e) => handleFieldChange('stage', e.target.value as Lead['stage'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {STAGE_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{lead.stage}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    {editing ? (
                      <select
                        value={formData.priority || 'medium'}
                        onChange={(e) => handleFieldChange('priority', e.target.value as Lead['priority'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{lead.priority}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value ($)</label>
                    {editing ? (
                      <input
                        type="number"
                        value={formData.deal_value || 0}
                        onChange={(e) => handleFieldChange('deal_value', parseFloat(e.target.value) || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <p className="text-gray-900">{lead.deal_value ? `$${lead.deal_value.toLocaleString()}` : '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    {editing ? (
                      <select
                        value={formData.source || 'manual'}
                        onChange={(e) => handleFieldChange('source', e.target.value as Lead['source'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {SOURCE_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{lead.source}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(formData.tags || []).map((tag) => (
                    <div key={tag} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      <span>{tag}</span>
                      {editing && (
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {editing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag()
                        }
                      }}
                      placeholder="Add a tag..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                {editing ? (
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Add notes about this lead..."
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{lead.notes || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleWon}
                  disabled={editing || lead.stage === 'won'}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  Mark as Won
                </button>
                <button
                  onClick={handleLost}
                  disabled={editing || lead.stage === 'lost'}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  Mark as Lost
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="text-gray-900">{new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Updated</p>
                  <p className="text-gray-900">{new Date(lead.updated_at).toLocaleDateString()}</p>
                </div>
                {lead.won_at && (
                  <div>
                    <p className="text-gray-600">Won At</p>
                    <p className="text-gray-900">{new Date(lead.won_at).toLocaleDateString()}</p>
                  </div>
                )}
                {lead.lost_at && (
                  <div>
                    <p className="text-gray-600">Lost At</p>
                    <p className="text-gray-900">{new Date(lead.lost_at).toLocaleDateString()}</p>
                  </div>
                )}
                {lead.lost_reason && (
                  <div>
                    <p className="text-gray-600">Loss Reason</p>
                    <p className="text-gray-900">{lead.lost_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
