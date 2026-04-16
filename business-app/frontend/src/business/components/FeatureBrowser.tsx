import { useEffect, useState } from 'react'
import { useFeatures, useFeatureCategories } from '../../hooks/useFeatures'
import type { Feature, BusinessType, FeatureBrowseFilters } from '../../types'

interface FeatureBrowserProps {
  businessType: BusinessType
  onSelectFeature: (featureId: string) => void
  selectedFeatureIds: Set<string>
  showPricing?: boolean
}

export function FeatureBrowser({
  businessType,
  onSelectFeature,
  selectedFeatureIds,
  showPricing = true,
}: FeatureBrowserProps) {
  const { features, loading, error, searchFeatures } = useFeatures()
  const { categories, fetchCategories } = useFeatureCategories()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priceFilter, setPriceFilter] = useState<{ min: number; max: number } | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    const filters: FeatureBrowseFilters = {
      category: selectedCategory || undefined,
      businessType,
      priceRange: priceFilter || undefined,
    }
    searchFeatures(searchQuery, filters)
  }, [businessType, selectedCategory, searchQuery, priceFilter, searchFeatures])

  const relevanceScore = (feature: Feature) => feature.relevant_for[businessType] || 0

  const filteredAndSorted = features.sort((a, b) => relevanceScore(b) - relevanceScore(a))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Feature Marketplace</h2>
        <p className="text-gray-600 mt-1">
          Browse and select features for your {businessType.replace(/_/g, ' ')} business
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search features..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
        )}

        {/* Price Range Filter */}
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
            <input
              type="number"
              placeholder="$0"
              value={priceFilter?.min || ''}
              onChange={(e) =>
                setPriceFilter({
                  min: parseInt(e.target.value) || 0,
                  max: priceFilter?.max || 10000,
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
            <input
              type="number"
              placeholder="$10000"
              value={priceFilter?.max || ''}
              onChange={(e) =>
                setPriceFilter({
                  min: priceFilter?.min || 0,
                  max: parseInt(e.target.value) || 10000,
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
            />
          </div>
          {priceFilter && (
            <button
              onClick={() => setPriceFilter(null)}
              className="self-end px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="text-gray-600">Loading features...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Features Grid */}
      {!loading && !error && (
        <>
          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No features found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSorted.map((feature) => {
                const isSelected = selectedFeatureIds.has(feature.id)
                const relevance = relevanceScore(feature)

                return (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    isSelected={isSelected}
                    relevanceScore={relevance}
                    onSelect={onSelectFeature}
                    showPricing={showPricing}
                  />
                )
              })}
            </div>
          )}

          {/* Summary */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900">
              <strong>{selectedFeatureIds.size}</strong> feature
              {selectedFeatureIds.size !== 1 ? 's' : ''} selected
              {showPricing && (
                <>
                  {' '}
                  • Monthly cost:{' '}
                  <strong>
                    $
                    {Array.from(selectedFeatureIds)
                      .reduce((sum, id) => {
                        const feature = features.find((f) => f.id === id)
                        return sum + (feature?.base_price_monthly || 0)
                      }, 0)
                      .toFixed(2)}
                  </strong>
                </>
              )}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

interface FeatureCardProps {
  feature: Feature
  isSelected: boolean
  relevanceScore: number
  onSelect: (featureId: string) => void
  showPricing: boolean
}

function FeatureCard({
  feature,
  isSelected,
  relevanceScore,
  onSelect,
  showPricing,
}: FeatureCardProps) {
  return (
    <div
      onClick={() => onSelect(feature.id)}
      className={`
        p-6 rounded-lg border-2 cursor-pointer transition-all
        ${
          isSelected
            ? 'border-blue-600 bg-blue-50 shadow-lg'
            : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {feature.icon && <span className="text-2xl">{feature.icon}</span>}
            <h3 className="text-lg font-bold text-gray-900">{feature.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(feature.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-2">
        <span
          className={`
            inline-block px-2 py-1 rounded text-xs font-medium
            ${getStatusColor(feature.status)}
          `}
        >
          {feature.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{feature.description}</p>

      {/* Relevance Score */}
      {relevanceScore > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Relevance</span>
            <span className="text-xs font-bold text-gray-700">{relevanceScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${relevanceScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Components */}
      {feature.components && feature.components.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Includes:</p>
          <div className="flex flex-wrap gap-1">
            {feature.components.slice(0, 3).map((comp, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {comp}
              </span>
            ))}
            {feature.components.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{feature.components.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pricing */}
      {showPricing && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-lg font-bold text-gray-900">
            ${feature.base_price_monthly.toFixed(2)}
            <span className="text-xs font-normal text-gray-600">/month</span>
          </p>
          {feature.additional_seats_price && (
            <p className="text-xs text-gray-600 mt-1">
              +${feature.additional_seats_price}/seat/month
            </p>
          )}
        </div>
      )}

      {/* Dependencies */}
      {feature.dependencies && feature.dependencies.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Requires:</p>
          <p className="text-xs text-gray-600">{feature.dependencies.join(', ')}</p>
        </div>
      )}
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'beta':
      return 'bg-yellow-100 text-yellow-800'
    case 'coming_soon':
      return 'bg-blue-100 text-blue-800'
    case 'deprecated':
      return 'bg-red-100 text-red-800'
    case 'development':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
