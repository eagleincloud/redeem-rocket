import { useState, memo } from 'react'

interface SequenceStep {
  stepNumber: number
  delayDays: number
  subject: string
  body: string
  templateId?: string
}

interface SequenceData {
  name: string
  triggerType: 'signup' | 'purchase' | 'manual' | 'abandoned_cart'
  steps: SequenceStep[]
}

const EmailSequenceBuilder = memo(function EmailSequenceBuilder({
  onSave,
}: {
  onSave: (data: SequenceData) => Promise<void>
}) {
  const [sequence, setSequence] = useState<SequenceData>({
    name: '',
    triggerType: 'signup',
    steps: [
      {
        stepNumber: 1,
        delayDays: 0,
        subject: '',
        body: '',
      },
    ],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addStep = () => {
    setSequence((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          stepNumber: prev.steps.length + 1,
          delayDays: (prev.steps[prev.steps.length - 1]?.delayDays || 0) + 1,
          subject: '',
          body: '',
        },
      ],
    }))
  }

  const removeStep = (index: number) => {
    setSequence((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, stepNumber: i + 1 })),
    }))
  }

  const updateStep = (
    index: number,
    field: keyof SequenceStep,
    value: any
  ) => {
    setSequence((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sequence.name.trim()) {
      setError('Sequence name is required')
      return
    }

    if (sequence.steps.some((s) => !s.subject.trim() || !s.body.trim())) {
      setError('All steps must have subject and body')
      return
    }

    setLoading(true)
    try {
      await onSave(sequence)
      alert('Sequence saved successfully!')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sequence')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Email Sequence Builder</h2>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sequence Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sequence Name
            </label>
            <input
              type="text"
              value={sequence.name}
              onChange={(e) =>
                setSequence((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Welcome Series"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trigger Type
            </label>
            <select
              value={sequence.triggerType}
              onChange={(e) =>
                setSequence((prev) => ({
                  ...prev,
                  triggerType: e.target.value as SequenceData['triggerType'],
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="signup">Signup</option>
              <option value="purchase">Purchase</option>
              <option value="manual">Manual</option>
              <option value="abandoned_cart">Abandoned Cart</option>
            </select>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Sequence Steps</h3>
            <button
              type="button"
              onClick={addStep}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Step
            </button>
          </div>

          {sequence.steps.map((step, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Step {step.stepNumber}</h4>
                {sequence.steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay (days)
                  </label>
                  <input
                    type="number"
                    value={step.delayDays}
                    onChange={(e) =>
                      updateStep(index, 'delayDays', parseInt(e.target.value))
                    }
                    min="0"
                    className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template (optional)
                  </label>
                  <input
                    type="text"
                    value={step.templateId || ''}
                    onChange={(e) => updateStep(index, 'templateId', e.target.value)}
                    placeholder="Template ID"
                    className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={step.subject}
                  onChange={(e) =>
                    updateStep(index, 'subject', e.target.value)
                  }
                  placeholder="Email subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body
                </label>
                <textarea
                  value={step.body}
                  onChange={(e) => updateStep(index, 'body', e.target.value)}
                  placeholder="Email content"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
        >
          {loading ? 'Saving...' : 'Save Sequence'}
        </button>
      </form>
    </div>
  )
})

export default EmailSequenceBuilder
