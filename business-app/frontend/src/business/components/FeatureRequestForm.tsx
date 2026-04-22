import { useState, useCallback } from 'react'
import { useFeatureRequests } from '../../hooks/useFeatures'
import type { BusinessType } from '../../types'

interface FeatureRequestFormProps {
  businessId: string
  requesterId: string
  businessTypes: BusinessType[]
  onRequestSubmitted?: () => void
}

export function FeatureRequestForm({
  businessId,
  requesterId,
  businessTypes,
  onRequestSubmitted,
}: FeatureRequestFormProps) {
  const { submitRequest, loading, error } = useFeatureRequests()
  const [formData, setFormData] = useState({
    featureName: '',
    description: '',
    selectedBusinessTypes: new Set<BusinessType>(),
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const handleBusinessTypeToggle = useCallback((businessType: BusinessType) => {
    setFormData((prev) => {
      const newTypes = new Set(prev.selectedBusinessTypes)
      if (newTypes.has(businessType)) {
        newTypes.delete(businessType)
      } else {
        newTypes.add(businessType)
      }
      return {
        ...prev,
        selectedBusinessTypes: newTypes,
      }
    })
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitError(null)

      // Validation
      if (!formData.featureName.trim()) {
        setSubmitError('Feature name is required')
        return
      }
      if (!formData.description.trim()) {
        setSubmitError('Description is required')
        return
      }
      if (formData.selectedBusinessTypes.size === 0) {
        setSubmitError('Please select at least one business type')
        return
      }

      try {
        await submitRequest(
          businessId,
          requesterId,
          formData.featureName,
          formData.description,
          Array.from(formData.selectedBusinessTypes)
        )

        setSubmitted(true)
        setFormData({
          featureName: '',
          description: '',
          selectedBusinessTypes: new Set(),
        })

        onRequestSubmitted?.()

        // Hide success message after 5 seconds
        setTimeout(() => setSubmitted(false), 5000)
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to submit feature request')
      }
    },
    [formData, businessId, requesterId, submitRequest, onRequestSubmitted]
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Request a New Feature</h2>
        <p className="text-gray-600 mt-2">
          Don't see what you need? Request a custom feature and our team will review it.
        </p>
      </div>

      {/* Success Message */}
      {submitted && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-bold text-green-900">Feature request submitted!</p>
              <p className="text-sm text-green-800 mt-1">
                Our team will review your request and get back to you soon. You can track the progress
                in your profile.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {(error || submitError) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error: {error || submitError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feature Name */}
        <div>
          <label htmlFor="featureName" className="block text-sm font-bold text-gray-900 mb-2">
            Feature Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="featureName"
            name="featureName"
            value={formData.featureName}
            onChange={handleInputChange}
            placeholder="e.g., Video Streaming Integration, Advanced Analytics Dashboard"
            maxLength={100}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="text-xs text-gray-600 mt-1">
            {formData.featureName.length}/100 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-bold text-gray-900 mb-2">
            Detailed Description <span className="text-red-600">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe what you need in detail:
- What problem does this solve?
- How would you use it?
- Any specific requirements or integrations?
- How important is this for your business?"
            rows={6}
            maxLength={2000}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            disabled={loading}
          />
          <p className="text-xs text-gray-600 mt-1">
            {formData.description.length}/2000 characters
          </p>
        </div>

        {/* Business Type Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Relevant for your business type(s) <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {businessTypes.map((businessType) => (
              <label
                key={businessType}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.selectedBusinessTypes.has(businessType)}
                  onChange={() => handleBusinessTypeToggle(businessType)}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-900 font-medium capitalize">
                  {businessType.replace(/_/g, ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-bold text-blue-900">What happens next:</p>
          <ol className="text-sm text-blue-800 space-y-1 ml-4">
            <li>1. Our team reviews your request</li>
            <li>2. AI generates an implementation</li>
            <li>3. Admin tests and approves it</li>
            <li>4. Feature added to your account</li>
          </ol>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || submitted}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Submitting...' : 'Submit Feature Request'}
          </button>
        </div>

        {/* T&C */}
        <p className="text-xs text-gray-600 text-center">
          By submitting a feature request, you agree to let us use your feedback to improve the platform.
        </p>
      </form>
    </div>
  )
}
