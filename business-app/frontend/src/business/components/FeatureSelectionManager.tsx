import { useState, useCallback, useMemo, useEffect } from 'react'
import { useBusinessFeatures } from '../../hooks/useFeatures'
import { FeatureBrowser } from './FeatureBrowser'
import { PricingCalculator } from './PricingCalculator'
import type { Feature, BusinessType } from '../../types'

interface FeatureSelectionManagerProps {
  businessId: string
  businessType: BusinessType
  teamMemberCount?: number
  showPricing?: boolean
  onSelectionChange?: (selectedFeatureIds: string[]) => void
  onSaveChanges?: (selectedFeatureIds: string[]) => Promise<void>
  allowEdit?: boolean
}

export function FeatureSelectionManager({
  businessId,
  businessType,
  teamMemberCount = 1,
  showPricing = true,
  onSelectionChange,
  onSaveChanges,
  allowEdit = true,
}: FeatureSelectionManagerProps) {
  const { features: businessFeatures, fetchBusinessFeatures, enableFeature, disableFeature } =
    useBusinessFeatures(businessId)
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set())
  const [allFeatures, setAllFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(false)
  const [savedChanges, setSavedChanges] = useState(false)

  // Load current business features on mount
  useEffect(() => {
    fetchBusinessFeatures()
  }, [businessId, fetchBusinessFeatures])

  // Populate selected features from business features
  useEffect(() => {
    const selected = new Set(businessFeatures.map((bf) => bf.feature_id))
    setSelectedFeatureIds(selected)
  }, [businessFeatures])

  // Get selected feature objects for pricing
  const selectedFeatures = useMemo(
    () =>
      allFeatures.filter((f) => selectedFeatureIds.has(f.id)).sort((a, b) => {
        const scoreA = a.relevant_for[businessType] || 0
        const scoreB = b.relevant_for[businessType] || 0
        return scoreB - scoreA
      }),
    [allFeatures, selectedFeatureIds, businessType]
  )

  const handleSelectFeature = useCallback(
    async (featureId: string) => {
      const newSelected = new Set(selectedFeatureIds)
      const isCurrentlySelected = newSelected.has(featureId)

      if (isCurrentlySelected) {
        newSelected.delete(featureId)
        // Optimistically update UI
        setSelectedFeatureIds(newSelected)
        // Then sync with database if auto-save
        if (allowEdit && onSaveChanges) {
          try {
            await disableFeature(featureId)
          } catch (err) {
            // Revert on error
            newSelected.add(featureId)
            setSelectedFeatureIds(newSelected)
            console.error('Failed to disable feature:', err)
          }
        }
      } else {
        newSelected.add(featureId)
        setSelectedFeatureIds(newSelected)
        // Then sync with database if auto-save
        if (allowEdit && onSaveChanges) {
          try {
            await enableFeature(featureId)
          } catch (err) {
            // Revert on error
            newSelected.delete(featureId)
            setSelectedFeatureIds(newSelected)
            console.error('Failed to enable feature:', err)
          }
        }
      }

      // Notify parent of change
      onSelectionChange?.(Array.from(newSelected))
      setSavedChanges(false)
    },
    [selectedFeatureIds, allowEdit, onSaveChanges, enableFeature, disableFeature, onSelectionChange]
  )

  const handleSaveChanges = useCallback(async () => {
    if (!onSaveChanges) return

    setLoading(true)
    try {
      await onSaveChanges(Array.from(selectedFeatureIds))
      setSavedChanges(true)
      setTimeout(() => setSavedChanges(false), 3000)
    } catch (err) {
      console.error('Failed to save feature changes:', err)
      alert('Failed to save changes. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedFeatureIds, onSaveChanges])

  return (
    <div className="space-y-8">
      {/* Selection Status */}
      {selectedFeatureIds.size > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-900 font-medium">
            ✓ {selectedFeatureIds.size} feature{selectedFeatureIds.size !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feature Browser - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <FeatureBrowser
            businessType={businessType}
            onSelectFeature={handleSelectFeature}
            selectedFeatureIds={selectedFeatureIds}
            showPricing={showPricing}
          />
        </div>

        {/* Pricing Calculator Sidebar */}
        {showPricing && (
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <PricingCalculator
                selectedFeatures={selectedFeatures}
                teamMemberCount={teamMemberCount}
              />

              {/* Save Changes Button (if manual save mode) */}
              {allowEdit && onSaveChanges && (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleSaveChanges}
                    disabled={loading || selectedFeatureIds.size === 0}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>

                  {savedChanges && (
                    <div className="bg-green-50 border border-green-200 text-green-900 text-sm p-3 rounded-lg">
                      ✓ Changes saved successfully!
                    </div>
                  )}
                </div>
              )}

              {/* Read-only mode notice */}
              {!allowEdit && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>View Only</strong> - You don't have permission to modify these settings.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary */}
      {selectedFeatureIds.size > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Features Selected</p>
              <p className="text-3xl font-bold text-gray-900">{selectedFeatureIds.size}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Cost</p>
              <p className="text-3xl font-bold text-gray-900">
                ${selectedFeatures
                  .reduce((sum, f) => {
                    const baseCost = f.base_price_monthly || 0
                    const seatCost =
                      (teamMemberCount - 1) * (f.additional_seats_price || 0)
                    return sum + baseCost + seatCost
                  }, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Annual Commitment</p>
              <p className="text-3xl font-bold text-gray-900">
                ${(
                  selectedFeatures.reduce((sum, f) => {
                    const baseCost = f.base_price_monthly || 0
                    const seatCost =
                      (teamMemberCount - 1) * (f.additional_seats_price || 0)
                    return sum + baseCost + seatCost
                  }, 0) * 12
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedFeatureIds.size === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-900 font-medium mb-2">No features selected yet</p>
          <p className="text-amber-800 text-sm">Select features from the marketplace to get started</p>
        </div>
      )}
    </div>
  )
}

// Simplified mode for quick feature selection during onboarding
export function FeatureSelectionQuick({
  businessType,
  onSelectionComplete,
}: {
  businessType: BusinessType
  onSelectionComplete: (featureIds: string[]) => void
}) {
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set())

  const handleSelectFeature = useCallback((featureId: string) => {
    setSelectedFeatureIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(featureId)) {
        newSet.delete(featureId)
      } else {
        newSet.add(featureId)
      }
      return newSet
    })
  }, [])

  const handleContinue = useCallback(() => {
    onSelectionComplete(Array.from(selectedFeatureIds))
  }, [selectedFeatureIds, onSelectionComplete])

  return (
    <div className="space-y-6">
      <FeatureBrowser
        businessType={businessType}
        onSelectFeature={handleSelectFeature}
        selectedFeatureIds={selectedFeatureIds}
        showPricing={true}
      />

      <div className="flex gap-4">
        <button
          onClick={handleContinue}
          disabled={selectedFeatureIds.size === 0}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Continue with {selectedFeatureIds.size} Feature
          {selectedFeatureIds.size !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}
