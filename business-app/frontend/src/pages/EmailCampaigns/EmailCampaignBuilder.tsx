import { useEffect, useState, memo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Campaign } from '../../types/growth-platform'

interface CampaignFormData {
  name: string
  subject: string
  body: string
  replyTo: string
  fromName: string
  sendAt?: string
  templateId?: string
  segmentId?: string
}

const EmailCampaignBuilder = memo(function EmailCampaignBuilder() {
  const navigate = useNavigate()
  const { campaignId } = useParams<{ campaignId?: string }>()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    subject: '',
    body: '',
    replyTo: '',
    fromName: '',
  })
  const [preview, setPreview] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) errors.name = 'Campaign name is required'
    if (!formData.subject.trim()) errors.subject = 'Email subject is required'
    if (!formData.body.trim()) errors.body = 'Email body is required'
    if (formData.subject.length > 255) errors.subject = 'Subject must be less than 255 characters'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.replyTo)) {
      errors.replyTo = 'Valid email address required for reply-to'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const method = campaignId ? 'PUT' : 'POST'
      const url = campaignId ? `/api/campaigns/${campaignId}` : '/api/campaigns'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'draft',
        }),
      })

      if (!response.ok) throw new Error('Failed to save campaign')

      const result = await response.json()
      navigate(`/email-campaigns/${result.id}`)
    } catch (error) {
      console.error('Campaign save error:', error)
      setValidationErrors({ submit: 'Failed to save campaign' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setValidationErrors((prev) => ({ ...prev, [name]: '' }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {campaignId ? 'Edit Campaign' : 'Create Email Campaign'}
          </h1>
          <p className="text-gray-600 mt-2">Design and configure your email campaign</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
              {validationErrors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
                  {validationErrors.submit}
                </div>
              )}

              {/* Campaign Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Spring Sale Campaign"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>

              {/* Subject Line */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g., Check out our spring collection {emoji}"
                  maxLength={255}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.subject.length}/255 characters
                </p>
                {validationErrors.subject && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.subject}</p>
                )}
              </div>

              {/* Email Body */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  placeholder="Enter your email content here. Use {name}, {email}, {company} for personalization."
                  rows={10}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                    validationErrors.body ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.body && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.body}</p>
                )}
              </div>

              {/* From Settings */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                  <input
                    type="text"
                    name="fromName"
                    value={formData.fromName}
                    onChange={handleChange}
                    placeholder="Your Company"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reply-To Email</label>
                  <input
                    type="email"
                    name="replyTo"
                    value={formData.replyTo}
                    onChange={handleChange}
                    placeholder="noreply@company.com"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.replyTo ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.replyTo && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.replyTo}</p>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send At (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="sendAt"
                  value={formData.sendAt || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to send immediately</p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
                >
                  {loading ? 'Saving...' : 'Save Campaign'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(!preview)}
                  className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
                >
                  {preview ? 'Hide Preview' : 'Preview'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/email-campaigns')}
                  className="px-6 py-2 text-gray-600 hover:text-gray-700 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Preview */}
          {preview && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>

                <div className="bg-gray-100 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">From</p>
                    <p className="font-medium text-gray-900">
                      {formData.fromName || 'Your Company'}
                    </p>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-600">Subject</p>
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {formData.subject || '(No subject)'}
                    </p>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-600">Body Preview</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
                      {formData.body || '(No content)'}
                    </p>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-600">Reply To</p>
                    <p className="text-sm text-blue-600">{formData.replyTo || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default EmailCampaignBuilder
