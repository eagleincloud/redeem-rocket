import { useEffect, useState } from 'react'
import { useFeatureTemplates } from '../../hooks/useFeatures'
import type { BusinessType, FeatureTemplate } from '../../types'

interface TemplateBrowserProps {
  businessType: BusinessType
  onSelectTemplate: (templateId: string) => void
  selectedTemplateId?: string
  showDetails?: boolean
}

export function TemplateBrowser({
  businessType,
  onSelectTemplate,
  selectedTemplateId,
  showDetails = true,
}: TemplateBrowserProps) {
  const { templates, loading, error, fetchTemplatesForBusinessType } = useFeatureTemplates()

  useEffect(() => {
    fetchTemplatesForBusinessType(businessType)
  }, [businessType, fetchTemplatesForBusinessType])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-600">Loading templates...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-blue-900 font-medium">No templates available</p>
        <p className="text-blue-800 text-sm mt-2">
          Start by selecting features individually from the Feature Marketplace
        </p>
      </div>
    )
  }

  // Sort by popular first
  const sorted = [...templates].sort((a, b) => {
    if (a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1
    return a.monthly_price - b.monthly_price
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Feature Templates</h2>
        <p className="text-gray-600 mt-1">
          Quick-start bundles pre-configured for {businessType.replace(/_/g, ' ')} businesses
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplateId === template.id}
            onSelect={onSelectTemplate}
            showDetails={showDetails}
          />
        ))}
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: FeatureTemplate
  isSelected: boolean
  onSelect: (templateId: string) => void
  showDetails?: boolean
}

function TemplateCard({
  template,
  isSelected,
  onSelect,
  showDetails = true,
}: TemplateCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      onClick={() => onSelect(template.id)}
      className={`
        p-6 rounded-lg border-2 cursor-pointer transition-all
        ${
          isSelected
            ? 'border-blue-600 bg-blue-50 shadow-lg'
            : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md'
        }
      `}
    >
      {/* Popular Badge */}
      {template.is_popular && (
        <div className="mb-3">
          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
            ⭐ POPULAR
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {template.icon && <span className="text-3xl">{template.icon}</span>}
            <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
          </div>
        </div>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(template.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
        />
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">{template.description}</p>

      {/* Feature Count */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-700">
          {template.feature_ids.length} feature{template.feature_ids.length !== 1 ? 's' : ''} included
        </p>
      </div>

      {/* Price */}
      <div className="mb-4">
        <p className="text-2xl font-bold text-gray-900">
          ${template.monthly_price.toFixed(2)}
          <span className="text-xs font-normal text-gray-600">/month</span>
        </p>
      </div>

      {/* Toggle Details */}
      {showDetails && template.feature_ids.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-3"
        >
          {expanded ? '▼ Hide' : '▶ Show'} features
        </button>
      )}

      {/* Expanded Features List */}
      {expanded && showDetails && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
          {template.feature_ids.map((featureId, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm text-gray-700 p-2 hover:bg-gray-100 rounded"
            >
              <span className="text-green-600">✓</span>
              <span className="flex-1 truncate">{featureId}</span>
            </div>
          ))}
        </div>
      )}

      {/* Selection State */}
      {isSelected && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-center">
          <p className="text-blue-900 font-bold text-sm">✓ Selected</p>
        </div>
      )}
    </div>
  )
}
