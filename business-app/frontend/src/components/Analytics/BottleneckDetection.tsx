import { useEffect, useState } from 'react'
import { AlertCircle, TrendingDown, Clock } from 'lucide-react'

interface PipelineStage {
  id: string
  name: string
  totalLeads: number
  averageTimeInStage: number
  conversionRate: number
  isBottleneck: boolean
  bottleneckScore: number
  recommendation: string
}

interface BottleneckData {
  stages: PipelineStage[]
  criticalBottlenecks: PipelineStage[]
  overallHealthScore: number
  lastUpdated: string
}

export default function BottleneckDetection() {
  const [data, setData] = useState<BottleneckData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBottleneckData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/v1/analytics/bottlenecks')
        if (!response.ok) throw new Error('Failed to fetch bottleneck data')
        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bottleneck data')
        // Mock data for demo
        setData({
          stages: [
            {
              id: 'lead',
              name: 'Lead Generation',
              totalLeads: 156,
              averageTimeInStage: 2,
              conversionRate: 45,
              isBottleneck: false,
              bottleneckScore: 0.2,
              recommendation: 'No action needed'
            },
            {
              id: 'contact',
              name: 'Contact Made',
              totalLeads: 70,
              averageTimeInStage: 8,
              conversionRate: 35,
              isBottleneck: true,
              bottleneckScore: 0.75,
              recommendation: 'Increase follow-up frequency. 8-day average is 2x industry standard.'
            },
            {
              id: 'qualified',
              name: 'Qualified',
              totalLeads: 25,
              averageTimeInStage: 12,
              conversionRate: 50,
              isBottleneck: true,
              bottleneckScore: 0.68,
              recommendation: 'Accelerate proposal delivery. Consider automated follow-ups.'
            },
            {
              id: 'proposal',
              name: 'Proposal',
              totalLeads: 12,
              averageTimeInStage: 15,
              conversionRate: 60,
              isBottleneck: true,
              bottleneckScore: 0.82,
              recommendation: 'Critical: Implement proposal templates and reduce decision time.'
            }
          ],
          criticalBottlenecks: [],
          overallHealthScore: 58,
          lastUpdated: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBottleneckData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pipeline Bottleneck Detection</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pipeline Bottleneck Detection</h2>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const criticalStages = data.stages.filter(s => s.isBottleneck)
  const healthColor =
    data.overallHealthScore >= 75 ? 'text-green-600' :
    data.overallHealthScore >= 50 ? 'text-yellow-600' :
    'text-red-600'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pipeline Bottleneck Detection</h2>
        <div className="text-right">
          <p className="text-sm text-gray-600">Overall Health</p>
          <p className={`text-3xl font-bold ${healthColor}`}>{data.overallHealthScore}%</p>
        </div>
      </div>

      {criticalStages.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">
                {criticalStages.length} Critical Bottleneck{criticalStages.length !== 1 ? 's' : ''} Detected
              </h3>
              <p className="text-sm text-red-800">
                {criticalStages.length === 1
                  ? `${criticalStages[0].name} is slowing down your pipeline.`
                  : `Multiple stages are creating friction in your sales process.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {data.stages.map((stage) => (
          <div
            key={stage.id}
            className={`border rounded-lg p-4 ${
              stage.isBottleneck ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {stage.totalLeads} leads | {stage.conversionRate}% conversion rate
                </p>
              </div>
              {stage.isBottleneck && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                  <TrendingDown size={14} />
                  Bottleneck
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                {stage.averageTimeInStage} days average
              </span>
              {stage.averageTimeInStage > 7 && (
                <span className="text-xs text-red-600 font-medium">
                  ({Math.round((stage.averageTimeInStage - 4) / 4 * 100)}% above target)
                </span>
              )}
            </div>

            {stage.isBottleneck && (
              <div className="bg-white rounded p-3 border border-red-200">
                <p className="text-sm font-medium text-gray-900 mb-1">Recommendation:</p>
                <p className="text-sm text-gray-700">{stage.recommendation}</p>
              </div>
            )}

            <div className="mt-3">
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    stage.bottleneckScore > 0.7 ? 'bg-red-500' :
                    stage.bottleneckScore > 0.4 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${stage.bottleneckScore * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Bottleneck score: {(stage.bottleneckScore * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-6">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </p>
    </div>
  )
}
