import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads } from '../../hooks/useLeads'
import type { Lead, LeadFilter } from '../../types/growth-platform'

const STAGE_COLORS: Record<Lead['stage'], string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-purple-100 text-purple-800',
  qualified: 'bg-green-100 text-green-800',
  proposal: 'bg-yellow-100 text-yellow-800',
  negotiation: 'bg-orange-100 text-orange-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
}

const PRIORITY_COLORS: Record<Lead['priority'], string> = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
}

export default function Leads() {
  const navigate = useNavigate()
  const { leads, loading, error, fetchLeads, deleteLead } = useLeads()
  const [filters, setFilters] = useState<LeadFilter>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const itemsPerPage = 50
  const totalPages = Math.ceil(leads.length / itemsPerPage)
  const paginatedLeads = leads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Stats calculation
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.stage === 'new').length,
    qualified: leads.filter((l) => l.stage === 'qualified').length,
    won: leads.filter((l) => l.stage === 'won').length,
    lost: leads.filter((l) => l.stage === 'lost').length,
  }

  useEffect(() => {
    fetchLeads(filters)
  }, [filters, fetchLeads])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }))
    setCurrentPage(1)
  }

  const handleStageFilter = (stage: Lead['stage'] | 'all') => {
    setFilters((prev) => ({
      ...prev,
      stage: stage === 'all' ? undefined : stage,
    }))
    setCurrentPage(1)
  }

  const handleSelectLead = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedLeads.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedLeads.map((l) => l.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.size} lead(s)?`)) return
    for (const id of selectedIds) {
      await deleteLead(id)
    }
    setSelectedIds(new Set())
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString()
  }

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading leads...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leads</h1>
          <p className="text-gray-600">Manage and track your sales leads</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'bg-blue-50 border-blue-200' },
            { label: 'New', value: stats.new, color: 'bg-purple-50 border-purple-200' },
            { label: 'Qualified', value: stats.qualified, color: 'bg-green-50 border-green-200' },
            { label: 'Won', value: stats.won, color: 'bg-emerald-50 border-emerald-200' },
            { label: 'Lost', value: stats.lost, color: 'bg-red-50 border-red-200' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} border rounded-lg p-4 text-center`}
            >
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6 p-4 space-y-4">
          {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              onChange={handleSearch}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={() => navigate('/leads/import')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Import
            </button>
          </div>

          {/* Stage Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const).map(
              (stage) => (
                <button
                  key={stage}
                  onClick={() => handleStageFilter(stage)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    (filters.stage === undefined && stage === 'all') || filters.stage === stage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <span className="text-sm font-medium text-blue-900">{selectedIds.size} selected</span>
              <button
                onClick={handleDeleteSelected}
                className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-8 p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paginatedLeads.length && paginatedLeads.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Name</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Email</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Phone</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Company</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Source</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Stage</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Priority</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Value</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Created</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    No leads found
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td
                      className="p-4"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectLead(lead.id)
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => handleSelectLead(lead.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900">{lead.name}</td>
                    <td className="py-4 px-6 text-gray-600">{lead.email || '-'}</td>
                    <td className="py-4 px-6 text-gray-600">{lead.phone || '-'}</td>
                    <td className="py-4 px-6 text-gray-600">{lead.company || '-'}</td>
                    <td className="py-4 px-6 text-gray-600 text-sm">{lead.source}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${STAGE_COLORS[lead.stage]}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className={`py-4 px-6 font-medium ${PRIORITY_COLORS[lead.priority]}`}>
                      {lead.priority}
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {lead.deal_value ? `$${lead.deal_value.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">{formatDate(lead.created_at)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/leads/${lead.id}`)
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
