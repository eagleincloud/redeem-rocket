import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Target, TrendingUp, AlertTriangle } from 'lucide-react'

interface MetricData {
  name: string
  target: number
  actual: number
  variance: number
  trend: 'up' | 'down' | 'stable'
  unit: string
}

interface PerformanceData {
  metrics: MetricData[]
  chartData: Array<{
    name: string
    target: number
    actual: number
  }>
  overallPerformance: number
  metricsAchievingGoal: number
  totalMetrics: number
}

export default function PerformanceTracking() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await fetch('/api/v1/analytics/performance')
        if (!response.ok) throw new Error('Failed to fetch performance data')
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching performance data:', err)
        // Mock data for demo
        setData({
          metrics: [
            {
              name: 'Response Time',
              target: 4,
              actual: 6.2,
              variance: -55,
              trend: 'down',
              unit: 'hours'
            },
            {
              name: 'Close Rate',
              target: 35,
              actual: 28,
              variance: -20,
              trend: 'stable',
              unit: '%'
            },
            {
              name: 'Deal Size',
              target: 15000,
              actual: 18500,
              variance: 23,
              trend: 'up',
              unit: 'INR'
            },
            {
              name: 'Lead Quality Score',
              target: 75,
              actual: 72,
              variance: -4,
              trend: 'stable',
              unit: 'points'
            }
          ],
          chartData: [
            { name: 'Response Time', target: 4, actual: 6.2 },
            { name: 'Close Rate', target: 35, actual: 28 },
            { name: 'Deal Size', target: 15, actual: 18.5 },
            { name: 'Quality Score', target: 75, actual: 72 }
          ],
          overallPerformance: 82,
          metricsAchievingGoal: 1,
          totalMetrics: 4
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Performance vs Goal</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Performance vs Goal</h2>
        <div className="text-right">
          <p className="text-sm text-gray-600">Overall Performance</p>
          <p className="text-3xl font-bold text-blue-600">{data.overallPerformance}%</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Metrics Achieving Goal</p>
          <p className="text-2xl font-bold text-blue-600">{data.metricsAchievingGoal}/{data.totalMetrics}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Need Improvement</p>
          <p className="text-2xl font-bold text-red-600">{data.totalMetrics - data.metricsAchievingGoal}/{data.totalMetrics}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Target vs Actual Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data.chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="target" fill="#3b82f6" name="Target" radius={[8, 8, 0, 0]} />
            <Bar dataKey="actual" fill="#10b981" name="Actual" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Metrics</h3>
        {data.metrics.map((metric, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{metric.name}</h4>
              <div className="flex items-center gap-2">
                {metric.variance > 0 ? (
                  <TrendingUp size={16} className="text-green-600" />
                ) : (
                  <AlertTriangle size={16} className="text-red-600" />
                )}
                <span className={`text-sm font-medium ${metric.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.variance > 0 ? '+' : ''}{metric.variance}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 mr-6">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600">Target: {metric.target} {metric.unit}</span>
                  <span className="text-xs text-gray-600">Actual: {metric.actual} {metric.unit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metric.variance >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min((metric.actual / metric.target) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              {metric.variance > 0
                ? `Exceeding target by ${Math.abs(metric.variance)}%`
                : `Missing target by ${Math.abs(metric.variance)}%`
              }
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex gap-3">
          <Target size={16} className="text-yellow-700 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Focus Areas</p>
            <p className="text-sm text-yellow-800 mt-1">
              Improve response time and close rate to achieve overall goals. Consider implementing follow-up automation and sales training.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
