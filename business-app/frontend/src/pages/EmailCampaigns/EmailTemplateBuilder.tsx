import { useState, memo, useCallback } from 'react'
import type { EmailTemplate } from '../../types/growth-platform'

interface TemplateFormData {
  name: string
  category: string
  subjectTemplate: string
  bodyHtml: string
  variables: Record<string, string>
  tags: string[]
}

const defaultVariables = {
  name: 'Recipient first name',
  email: 'Recipient email address',
  company: 'Company name',
  personalization: 'Custom personalization text',
  date: 'Current date',
}

const EmailTemplateBuilder = memo(function EmailTemplateBuilder() {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    category: 'marketing',
    subjectTemplate: '',
    bodyHtml: '',
    variables: defaultVariables,
    tags: [],
  })
  const [preview, setPreview] = useState(false)
  const [draggedVariable, setDraggedVariable] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const insertVariable = useCallback(
    (variable: string) => {
      const textarea = document.getElementById('bodyHtml') as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = formData.bodyHtml
        const newText = text.substring(0, start) + `{${variable}}` + text.substring(end)
        setFormData((prev) => ({ ...prev, bodyHtml: newText }))
      }
    },
    [formData.bodyHtml]
  )

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) errors.name = 'Template name is required'
    if (!formData.subjectTemplate.trim()) errors.subjectTemplate = 'Subject template is required'
    if (!formData.bodyHtml.trim()) errors.bodyHtml = 'Email body is required'

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save template')

      alert('Template saved successfully!')
      setFormData({
        name: '',
        category: 'marketing',
        subjectTemplate: '',
        bodyHtml: '',
        variables: defaultVariables,
        tags: [],
      })
    } catch (error) {
      console.error('Template save error:', error)
      setValidationErrors({ submit: 'Failed to save template' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setValidationErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleDragStart = (variable: string) => {
    setDraggedVariable(variable)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedVariable) {
      insertVariable(draggedVariable)
      setDraggedVariable(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Email Template Builder</h1>
          <p className="text-gray-600 mt-2">Create reusable email templates with drag-drop variables</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Variables Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Insert Variables</h3>
              <p className="text-xs text-gray-600 mb-4">Drag variables to body or click to insert</p>

              <div className="space-y-2">
                {Object.entries(defaultVariables).map(([key, description]) => (
                  <button
                    key={key}
                    draggable
                    onDragStart={() => handleDragStart(key)}
                    onClick={() => insertVariable(key)}
                    title={description}
                    className="w-full text-left px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                  >
                    {`{${key}}`}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Preview Variables</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  {Object.entries(defaultVariables).map(([key, desc]) => (
                    <p key={key}>
                      <span className="font-mono bg-gray-100 px-1">{`{${key}}`}</span> = {desc}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3">
            {validationErrors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
                {validationErrors.submit}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Welcome Email"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="marketing">Marketing</option>
                  <option value="transactional">Transactional</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
            </div>

            {/* Subject Template */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject Template</label>
              <input
                type="text"
                name="subjectTemplate"
                value={formData.subjectTemplate}
                onChange={handleChange}
                placeholder="e.g., Welcome {name}! Check out our latest offers"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.subjectTemplate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.subjectTemplate && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.subjectTemplate}</p>
              )}
            </div>

            {/* Body */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Email Body (HTML)</label>
                <button
                  type="button"
                  onClick={() => setPreview(!preview)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {preview ? 'Edit' : 'Preview'}
                </button>
              </div>

              <textarea
                id="bodyHtml"
                name="bodyHtml"
                value={formData.bodyHtml}
                onChange={handleChange}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                placeholder="Enter HTML content... Drop variables here!"
                rows={12}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                  validationErrors.bodyHtml ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.bodyHtml && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.bodyHtml}</p>
              )}

              {preview && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
                  <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: formData.bodyHtml.replace(
                        /\{(\w+)\}/g,
                        '<span class="bg-yellow-100 px-1 rounded">$1</span>'
                      ),
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., welcome, automation, promotional"
                onBlur={(e) => {
                  const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                  setFormData((prev) => ({ ...prev, tags }))
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
              >
                {loading ? 'Saving...' : 'Save Template'}
              </button>
              <button
                type="reset"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
})

export default EmailTemplateBuilder
