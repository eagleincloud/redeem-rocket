import { memo } from 'react'

interface PreviewData {
  fromName: string
  subject: string
  body: string
  variables?: Record<string, string>
}

const EmailPreview = memo(function EmailPreview({
  data,
  onClose,
}: {
  data: PreviewData
  onClose: () => void
}) {
  const renderContent = (content: string) => {
    let rendered = content

    if (data.variables) {
      Object.entries(data.variables).forEach(([key, value]) => {
        rendered = rendered.replace(new RegExp(`{${key}}`, 'g'), value)
      })
    }

    return rendered
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-100 px-6 py-4 flex items-center justify-between border-b">
          <h2 className="text-lg font-semibold text-gray-900">Email Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-2xl"
          >
            ×
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          {/* From */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">From</p>
            <p className="text-lg font-medium text-gray-900">
              {data.fromName || 'Your Company'}
            </p>
          </div>

          {/* Subject */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Subject</p>
            <p className="text-base text-gray-900 font-medium">
              {renderContent(data.subject) || '(No subject)'}
            </p>
          </div>

          {/* Body */}
          <div className="mb-6">
            <p className="text-xs text-gray-600 uppercase font-semibold mb-3">Message</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {renderContent(data.body) || '(No content)'}
            </div>
          </div>

          {/* Variables Used */}
          {data.variables && Object.keys(data.variables).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Variables in Preview</p>
              <div className="space-y-1 text-xs text-blue-800">
                {Object.entries(data.variables).map(([key, value]) => (
                  <p key={key}>
                    <span className="font-mono font-bold">{`{${key}}`}</span> = {value}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
})

export default EmailPreview
