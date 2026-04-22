import { useState, useCallback } from 'react'
import type { Feature, FeatureCategory, BusinessType } from '../../types'

interface FeatureEditorProps {
  feature?: Feature | null
  categories: FeatureCategory[]
  onSave: (data: Omit<Feature, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}

export function FeatureEditor({ feature, categories, onSave, onCancel }: FeatureEditorProps) {
  const [formData, setFormData] = useState({
    slug: feature?.slug || '',
    name: feature?.name || '',
    description: feature?.description || '',
    long_description: feature?.long_description || '',
    category: feature?.category || '',
    icon: feature?.icon || '',
    status: feature?.status || 'development' as const,
    base_price_monthly: feature?.base_price_monthly || 0,
    additional_seats_price: feature?.additional_seats_price || 0,
    relevant_for: feature?.relevant_for || {
      ecommerce: 0,
      services: 0,
      marketplace: 0,
      b2b: 0,
    },
    components: feature?.components || [],
    dependencies: feature?.dependencies || [],
  })

  const [newComponent, setNewComponent] = useState('')
  const [newDependency, setNewDependency] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.slug.trim()) newErrors.slug = 'Slug is required'
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (formData.base_price_monthly < 0) newErrors.base_price_monthly = 'Price must be positive'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      onSave({
        ...formData,
        status: formData.status as any,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('_price') ? parseFloat(value) || 0 : value,
    }))
  }

  const handleRelevanceChange = (businessType: BusinessType, value: number) => {
    setFormData((prev) => ({
      ...prev,
      relevant_for: {
        ...prev.relevant_for,
        [businessType]: value,
      },
    }))
  }

  const addComponent = () => {
    if (newComponent.trim()) {
      setFormData((prev) => ({
        ...prev,
        components: [...prev.components, newComponent.trim()],
      }))
      setNewComponent('')
    }
  }

  const removeComponent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index),
    }))
  }

  const addDependency = () => {
    if (newDependency.trim()) {
      setFormData((prev) => ({
        ...prev,
        dependencies: [...prev.dependencies, newDependency.trim()],
      }))
      setNewDependency('')
    }
  }

  const removeDependency = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      dependencies: prev.dependencies.filter((_, i) => i !== index),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {feature ? '✏️ Edit Feature' : '➕ Create New Feature'}
        </h2>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug*</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              placeholder="feature-name"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.slug ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.slug && <p className="text-red-600 text-xs mt-1">{errors.slug}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Feature Name"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
          <input
            type="text"
            name="icon"
            value={formData.icon}
            onChange={handleInputChange}
            placeholder="🎯"
            maxLength={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Description*</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of the feature"
            rows={2}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
          <textarea
            name="long_description"
            value={formData.long_description}
            onChange={handleInputChange}
            placeholder="Detailed description of features included"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category & Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Category & Status</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status*</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="beta">Beta</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="development">Development</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Pricing</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Monthly)*</label>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">$</span>
              <input
                type="number"
                name="base_price_monthly"
                value={formData.base_price_monthly}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.base_price_monthly ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.base_price_monthly && (
              <p className="text-red-600 text-xs mt-1">{errors.base_price_monthly}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Seat Price</label>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">$</span>
              <input
                type="number"
                name="additional_seats_price"
                value={formData.additional_seats_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-600 ml-2">/seat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Business Type Relevance */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Business Type Relevance (0-100)</h3>

        <div className="grid grid-cols-2 gap-4">
          {['ecommerce', 'services', 'marketplace', 'b2b'].map((type) => (
            <div key={type}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{type}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.relevant_for[type as BusinessType]}
                onChange={(e) => handleRelevanceChange(type as BusinessType, parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-600 text-right mt-1">
                {formData.relevant_for[type as BusinessType]}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Components */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">React Components Included</h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={newComponent}
            onChange={(e) => setNewComponent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (addComponent(), e.preventDefault())}
            placeholder="Component name (e.g., FeatureCard)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addComponent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {formData.components.map((comp, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-900">{comp}</span>
              <button
                type="button"
                onClick={() => removeComponent(idx)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dependencies */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Feature Dependencies</h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={newDependency}
            onChange={(e) => setNewDependency(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (addDependency(), e.preventDefault())}
            placeholder="Dependency slug (e.g., email-integration)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addDependency}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {formData.dependencies.map((dep, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-900">{dep}</span>
              <button
                type="button"
                onClick={() => removeDependency(idx)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Feature'}
        </button>
      </div>
    </form>
  )
}
