import { useState } from 'react'
import { FeatureBrowser } from '../components/FeatureBrowser'
import { TemplateBrowser } from '../components/TemplateBrowser'
import { FeatureRequestForm } from '../components/FeatureRequestForm'
import { FeatureSelectionManager } from '../components/FeatureSelectionManager'
import type { BusinessType } from '../../types'

interface FeatureMarketplacePageProps {
  businessId: string
  businessType: BusinessType
  userId: string
  teamMemberCount?: number
}

type TabType = 'browse' | 'templates' | 'manage' | 'request'

export function FeatureMarketplacePage({
  businessId,
  businessType,
  userId,
  teamMemberCount = 1,
}: FeatureMarketplacePageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('manage')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">🎯 Feature Marketplace</h1>
          <p className="text-gray-600 mt-2">
            Customize your platform with handpicked features for your {businessType.replace(/_/g, ' ')} business
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8">
          <nav className="flex gap-8">
            {[
              { id: 'manage' as TabType, label: '⚙️ Manage Features', icon: '✓' },
              { id: 'templates' as TabType, label: '📦 Templates', icon: '⭐' },
              { id: 'browse' as TabType, label: '🔍 Browse All', icon: '🔎' },
              { id: 'request' as TabType, label: '💡 Request Feature', icon: '+' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-4 font-medium border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Manage Features Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-2">Your Current Setup</h2>
              <p className="text-blue-800">
                Manage which features are active on your platform. Enable additional features to unlock
                new capabilities, or disable unused ones to reduce costs.
              </p>
            </div>

            <FeatureSelectionManager
              businessId={businessId}
              businessType={businessType}
              teamMemberCount={teamMemberCount}
              showPricing={true}
              allowEdit={true}
              onSelectionChange={(selectedIds) => {
                console.log('Selected features:', selectedIds)
              }}
              onSaveChanges={async (selectedIds) => {
                console.log('Saving selected features:', selectedIds)
                // In real app, this would call the backend API
              }}
            />
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-8">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-amber-900 mb-2">Quick-Start Bundles</h2>
              <p className="text-amber-800">
                Pre-configured feature bundles optimized for specific use cases. Select a template to
                instantly enable all related features.
              </p>
            </div>

            <TemplateBrowser
              businessType={businessType}
              onSelectTemplate={(templateId) => {
                console.log('Selected template:', templateId)
                // In real app, this would apply the template
              }}
              showDetails={true}
            />
          </div>
        )}

        {/* Browse All Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-green-900 mb-2">Complete Feature Catalog</h2>
              <p className="text-green-800">
                Browse the entire feature catalog filtered for your business type. Features are ranked
                by relevance to help you find what you need.
              </p>
            </div>

            <FeatureBrowser
              businessType={businessType}
              onSelectFeature={(featureId) => {
                console.log('Browsing feature:', featureId)
              }}
              selectedFeatureIds={new Set()}
              showPricing={true}
            />
          </div>
        )}

        {/* Request Feature Tab */}
        {activeTab === 'request' && (
          <div className="space-y-8 max-w-2xl">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-purple-900 mb-2">Custom Feature Development</h2>
              <p className="text-purple-800">
                Can't find what you need? Submit a feature request and our team will evaluate it for
                development. Approved features will be built and added to your platform.
              </p>
            </div>

            <FeatureRequestForm
              businessId={businessId}
              requesterId={userId}
              businessTypes={[businessType]}
              onRequestSubmitted={() => {
                // Switch to manage tab after submission
                setTimeout(() => setActiveTab('manage'), 2000)
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="font-bold text-gray-900 mb-2">💰 Flexible Pricing</p>
              <p className="text-sm text-gray-600">
                Pay only for what you use. Your monthly bill adjusts when you add or remove features.
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-2">🚀 Fast Deployment</p>
              <p className="text-sm text-gray-600">
                Features are enabled instantly. No setup or configuration needed for most features.
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-2">🔄 Always Evolving</p>
              <p className="text-sm text-gray-600">
                New features are added regularly based on customer demand and feedback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export standalone components for use in other pages
export { FeatureBrowser, TemplateBrowser, FeatureRequestForm, FeatureSelectionManager }
