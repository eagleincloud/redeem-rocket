import { useState, useMemo } from 'react'
import type { Feature } from '../types'

interface FeatureUsageProps {
  features: Feature[]
  businessFeatureMap: Map<string, number> // featureId -> count of businesses using it
}

export function FeatureUsageStats({ features, businessFeatureMap }: FeatureUsageProps) {
  const [sortBy, setSortBy] = useState<'adoption' | 'price' | 'revenue'>('adoption')

  // Calculate metrics
  const metricsData = useMemo(() => {
    return features.map((feature) => {
      const adoptionCount = businessFeatureMap.get(feature.id) || 0
      const totalBusinesses = businessFeatureMap.size || 1
      const adoptionRate = (adoptionCount / totalBusinesses) * 100
      const estimatedRevenue = adoptionCount * feature.base_price_monthly * 12 // annual

      return {
        feature,
        adoptionCount,
        adoptionRate,
        estimatedRevenue,
      }
    })
  }, [features, businessFeatureMap])

  // Sort
  const sortedMetrics = useMemo(() => {
    const copy = [...metricsData]
    switch (sortBy) {
      case 'adoption':
        return copy.sort((a, b) => b.adoptionCount - a.adoptionCount)
      case 'price':
        return copy.sort((a, b) => b.feature.base_price_monthly - a.feature.base_price_monthly)
      case 'revenue':
        return copy.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
      default:
        return copy
    }
  }, [metricsData, sortBy])

  // Summary stats
  const totalAdoptions = metricsData.reduce((sum, m) => sum + m.adoptionCount, 0)
  const avgAdoptionRate = metricsData.length > 0 ? metricsData.reduce((sum, m) => sum + m.adoptionRate, 0) / metricsData.length : 0
  const totalEstimatedRevenue = metricsData.reduce((sum, m) => sum + m.estimatedRevenue, 0)
  const topFeature = sortedMetrics[0]
  const leastUsedFeature = sortedMetrics[sortedMetrics.length - 1]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">📊 Feature Usage Analytics</h1>
          <p className="text-gray-600 mt-2">Track adoption rates, revenue impact, and feature popularity</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="Total Adoptions"
            value={totalAdoptions}
            icon="📦"
            color="blue"
            subtext={`${features.length} features tracked`}
          />
          <MetricCard
            label="Average Adoption Rate"
            value={`${avgAdoptionRate.toFixed(1)}%`}
            icon="📈"
            color="green"
            subtext="Across all features"
          />
          <MetricCard
            label="Estimated Annual Revenue"
            value={`$${(totalEstimatedRevenue / 1000).toFixed(1)}K`}
            icon="💰"
            color="purple"
            subtext="From feature charges"
          />
          <MetricCard
            label="Feature Count"
            value={features.length}
            icon="🎯"
            color="orange"
            subtext={`${features.filter((f) => f.status === 'active').length} active`}
          />
        </div>

        {/* Top/Bottom Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {topFeature && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <p className="text-sm font-medium text-green-700 mb-2">🏆 Most Popular Feature</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{topFeature.feature.name}</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-green-700 font-bold">{topFeature.adoptionCount}</span> businesses using
                </p>
                <p>
                  <span className="text-green-700 font-bold">{topFeature.adoptionRate.toFixed(1)}%</span> adoption rate
                </p>
                <p>
                  <span className="text-green-700 font-bold">${topFeature.estimatedRevenue.toFixed(0)}</span> annual revenue
                </p>
              </div>
            </div>
          )}

          {leastUsedFeature && (
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
              <p className="text-sm font-medium text-orange-700 mb-2">📉 Least Used Feature</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{leastUsedFeature.feature.name}</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-orange-700 font-bold">{leastUsedFeature.adoptionCount}</span> businesses using
                </p>
                <p>
                  <span className="text-orange-700 font-bold">{leastUsedFeature.adoptionRate.toFixed(1)}%</span> adoption rate
                </p>
                <p className="text-orange-700 text-xs mt-2">Consider promoting or redesigning this feature</p>
              </div>
            </div>
          )}
        </div>

        {/* Features Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Feature Metrics</h2>
            <div className="flex gap-2">
              {['adoption', 'price', 'revenue'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                    sortBy === opt
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt === 'adoption' ? '📊 Adoption' : opt === 'price' ? '💵 Price' : '💰 Revenue'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Feature</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Businesses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Adoption Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Monthly Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Annual Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedMetrics.map((metric) => (
                  <tr key={metric.feature.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{metric.feature.name}</p>
                        <p className="text-sm text-gray-600">{metric.feature.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {metric.adoptionCount}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${metric.adoptionRate}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{metric.adoptionRate.toFixed(1)}%</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${metric.feature.base_price_monthly.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ${metric.estimatedRevenue.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(metric.feature.status)}`}
                      >
                        {metric.feature.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-3">💡 Recommendations</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Features with low adoption might need better marketing</li>
              <li>• Consider bundling low-adoption features with popular ones</li>
              <li>• High-adoption features could justify premium pricing</li>
              <li>• Monitor feature requests for gaps in your catalog</li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-bold text-purple-900 mb-3">🎯 Strategy Tips</h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li>• Use adoption data to guide new feature development</li>
              <li>• Deprecate features with zero adoption after 6 months</li>
              <li>• Create feature combos based on usage patterns</li>
              <li>• Offer discounts on low-adoption features to drive usage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  color,
  subtext,
}: {
  label: string
  value: string | number
  icon: string
  color: string
  subtext?: string
}) {
  const colorClass = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
  }[color]

  return (
    <div className={`${colorClass} border rounded-lg p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtext && <p className="text-xs text-gray-600 mt-2">{subtext}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'beta':
      return 'bg-yellow-100 text-yellow-800'
    case 'coming_soon':
      return 'bg-blue-100 text-blue-800'
    case 'deprecated':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
