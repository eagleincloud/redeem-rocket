import { useState, useEffect } from 'react'
import * as featureService from '../../lib/supabase/features'
import { FeatureEditor } from './FeatureEditor'
import type { Feature, FeatureCategory } from '../../types'

export function AdminFeatureManagement() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [categories, setCategories] = useState<FeatureCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load features and categories
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [featuresData, categoriesData] = await Promise.all([
        featureService.getActiveFeatures(),
        featureService.getFeatureCategories(),
      ])
      setFeatures(featuresData)
      setCategories(categoriesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFeature = async (featureData: Omit<Feature, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newFeature = await featureService.createFeature(featureData)
      setFeatures((prev) => [...prev, newFeature])
      setShowCreateDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create feature')
    }
  }

  const handleUpdateFeature = async (featureId: string, updates: Partial<Feature>) => {
    try {
      const updated = await featureService.updateFeature(featureId, updates)
      setFeatures((prev) => prev.map((f) => (f.id === featureId ? updated : f)))
      setEditingFeature(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feature')
    }
  }

  const handleDeleteFeature = async (featureId: string) => {
    try {
      // Note: You may need to add a delete function to the feature service
      // For now, we'll set status to deprecated as a soft delete
      await featureService.updateFeature(featureId, { status: 'deprecated' })
      setFeatures((prev) => prev.filter((f) => f.id !== featureId))
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete feature')
    }
  }

  const handleToggleStatus = async (featureId: string, currentStatus: string) => {
    const statuses: Array<typeof currentStatus> = ['active', 'beta', 'coming_soon', 'deprecated']
    const currentIndex = statuses.indexOf(currentStatus as any)
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]

    try {
      const updated = await featureService.updateFeature(featureId, { status: nextStatus as any })
      setFeatures((prev) => prev.map((f) => (f.id === featureId ? updated : f)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feature status')
    }
  }

  // Filter features
  const filteredFeatures = features.filter((f) => {
    const matchCategory = !selectedCategory || f.category === selectedCategory
    const matchSearch =
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">🎛️ Feature Catalog Management</h1>
              <p className="text-gray-600 mt-2">Manage features available in the marketplace</p>
            </div>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
            >
              + New Feature
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700 text-sm mt-2 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Features</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{features.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {features.filter((f) => f.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">In Beta</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {features.filter((f) => f.status === 'beta').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Coming Soon</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {features.filter((f) => f.status === 'coming_soon').length}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Search features by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Features Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading features...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Business Types</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeatures.map((feature) => (
                    <tr key={feature.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{feature.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{feature.category}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleToggleStatus(feature.id, feature.status)}
                          className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition ${getStatusColor(feature.status)}`}
                        >
                          {feature.status.replace('_', ' ')}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${feature.base_price_monthly.toFixed(2)}/mo
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {Object.entries(feature.relevant_for)
                          .filter(([_, score]) => score > 0)
                          .length > 0
                          ? Object.entries(feature.relevant_for)
                              .filter(([_, score]) => score > 0)
                              .map(([type]) => type)
                              .join(', ')
                          : 'None'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingFeature(feature)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(feature.id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredFeatures.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-900 font-medium">No features found</p>
            <p className="text-blue-800 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {(showCreateDialog || editingFeature) && (
        <FeatureEditorDialog
          feature={editingFeature}
          categories={categories}
          onSave={editingFeature ? handleUpdateFeature : handleCreateFeature}
          onCancel={() => {
            setShowCreateDialog(false)
            setEditingFeature(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Feature"
          message="Are you sure you want to delete this feature? This action cannot be undone."
          onConfirm={() => handleDeleteFeature(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

function FeatureEditorDialog({
  feature,
  categories,
  onSave,
  onCancel,
}: {
  feature: Feature | null
  categories: FeatureCategory[]
  onSave: (id: string | undefined, data: any) => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <FeatureEditor
          feature={feature}
          categories={categories}
          onSave={(data) => onSave(feature?.id, data)}
          onCancel={onCancel}
        />
      </div>
    </div>
  )
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 hover:bg-green-200'
    case 'beta':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    case 'coming_soon':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    case 'deprecated':
      return 'bg-red-100 text-red-800 hover:bg-red-200'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
}
