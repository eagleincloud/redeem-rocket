import { useMemo } from 'react'
import type { Feature } from '../../types'

interface PricingCalculatorProps {
  selectedFeatures: Feature[]
  teamMemberCount?: number
  customPricingOverride?: number
}

interface PricingBreakdown {
  baseFeaturesCost: number
  additionalSeatsCost: number
  subtotal: number
  customPricingOverride: number
  totalMonthlyCost: number
}

export function PricingCalculator({
  selectedFeatures,
  teamMemberCount = 1,
  customPricingOverride,
}: PricingCalculatorProps) {
  const breakdown = useMemo<PricingBreakdown>(() => {
    // Calculate base features cost
    const baseFeaturesCost = selectedFeatures.reduce(
      (sum, feature) => sum + (feature.base_price_monthly || 0),
      0
    )

    // Calculate additional seats cost
    // Typically, additional seats are for team members beyond the first
    let additionalSeatsCost = 0
    if (teamMemberCount > 1) {
      const additionalSeats = teamMemberCount - 1
      additionalSeatsCost = selectedFeatures.reduce((sum, feature) => {
        const seatPrice = feature.additional_seats_price || 0
        return sum + seatPrice * additionalSeats
      }, 0)
    }

    const subtotal = baseFeaturesCost + additionalSeatsCost

    // Apply custom pricing override if provided (could be a discount or fixed price)
    let totalMonthlyCost = subtotal
    if (customPricingOverride !== undefined && customPricingOverride > 0) {
      totalMonthlyCost = customPricingOverride
    }

    return {
      baseFeaturesCost,
      additionalSeatsCost,
      subtotal,
      customPricingOverride: customPricingOverride || 0,
      totalMonthlyCost,
    }
  }, [selectedFeatures, teamMemberCount, customPricingOverride])

  const hasCustomPricing = customPricingOverride && customPricingOverride > 0

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Pricing Breakdown</h3>
        <p className="text-sm text-gray-600 mt-1">
          Monthly cost based on {selectedFeatures.length} selected feature
          {selectedFeatures.length !== 1 ? 's' : ''} and {teamMemberCount} team member
          {teamMemberCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Features Cost */}
      <div className="space-y-3 mb-4 pb-4 border-b border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">
            Base Features <span className="text-xs text-gray-500">({selectedFeatures.length})</span>
          </span>
          <span className="font-semibold text-gray-900">
            ${breakdown.baseFeaturesCost.toFixed(2)}
          </span>
        </div>

        {/* Feature Breakdown */}
        {selectedFeatures.length > 0 && (
          <div className="ml-4 space-y-2 text-sm">
            {selectedFeatures.map((feature) => (
              <div key={feature.id} className="flex justify-between text-gray-600">
                <span>{feature.name}</span>
                <span>${feature.base_price_monthly.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Seats */}
      {teamMemberCount > 1 && (
        <div className="space-y-3 mb-4 pb-4 border-b border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">
              Additional Team Members{' '}
              <span className="text-xs text-gray-500">({teamMemberCount - 1})</span>
            </span>
            <span className="font-semibold text-gray-900">
              ${breakdown.additionalSeatsCost.toFixed(2)}
            </span>
          </div>

          {/* Seats Breakdown */}
          {breakdown.additionalSeatsCost > 0 && selectedFeatures.some(f => f.additional_seats_price) && (
            <div className="ml-4 space-y-2 text-sm">
              {selectedFeatures
                .filter((f) => f.additional_seats_price)
                .map((feature) => (
                  <div key={feature.id} className="flex justify-between text-gray-600">
                    <span>
                      {feature.name}{' '}
                      <span className="text-xs">
                        (${feature.additional_seats_price}/seat × {teamMemberCount - 1})
                      </span>
                    </span>
                    <span>
                      ${((feature.additional_seats_price || 0) * (teamMemberCount - 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Subtotal */}
      <div className="mb-4 pb-4 border-b border-blue-200 flex justify-between items-center">
        <span className="text-gray-700 font-medium">Subtotal</span>
        <span className="text-lg font-bold text-gray-900">
          ${breakdown.subtotal.toFixed(2)}/month
        </span>
      </div>

      {/* Custom Pricing */}
      {hasCustomPricing && (
        <div className="mb-4 pb-4 border-b border-blue-200">
          <div className="flex justify-between items-center mb-2 bg-orange-50 p-3 rounded border border-orange-200">
            <span className="text-orange-900 font-medium">Custom Pricing</span>
            <span className="font-bold text-orange-900">
              ${breakdown.customPricingOverride.toFixed(2)}/month
            </span>
          </div>
          <p className="text-xs text-orange-700 ml-3">
            {breakdown.customPricingOverride < breakdown.subtotal
              ? `You're saving $${(breakdown.subtotal - breakdown.customPricingOverride).toFixed(2)}/month`
              : `Custom pricing applied`}
          </p>
        </div>
      )}

      {/* Total */}
      <div className="bg-white rounded-lg p-4 border border-blue-300">
        <div className="flex justify-between items-baseline">
          <span className="text-gray-900 font-bold">Total Monthly Cost</span>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">
              ${breakdown.totalMonthlyCost.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Billed monthly</p>
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="mt-6 pt-6 border-t border-blue-200 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Features selected:</span>
          <span className="font-medium text-gray-900">{selectedFeatures.length}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Team members:</span>
          <span className="font-medium text-gray-900">{teamMemberCount}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Annual commitment:</span>
          <span className="font-medium text-gray-900">
            ${(breakdown.totalMonthlyCost * 12).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-100 border border-blue-300 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> You can add or remove features anytime from your profile settings.
          Your billing will be adjusted accordingly.
        </p>
      </div>
    </div>
  )
}

// Simplified version for quick preview during feature selection
export function QuickPricingPreview({
  selectedFeatures,
  teamMemberCount = 1,
}: {
  selectedFeatures: Feature[]
  teamMemberCount?: number
}) {
  const totalCost = useMemo(() => {
    const baseCost = selectedFeatures.reduce((sum, f) => sum + (f.base_price_monthly || 0), 0)
    const seatCost =
      teamMemberCount > 1
        ? selectedFeatures.reduce(
            (sum, f) => sum + ((f.additional_seats_price || 0) * (teamMemberCount - 1)),
            0
          )
        : 0
    return baseCost + seatCost
  }, [selectedFeatures, teamMemberCount])

  return (
    <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
      <p className="text-sm font-semibold text-gray-900">
        ${totalCost.toFixed(2)}<span className="text-xs font-normal text-gray-600">/month</span>
      </p>
    </div>
  )
}
