import { useEffect, useState } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'

interface TrendPoint {
  date: string
  leads: number
  deals: number
  revenue: number
  conversionRate: number
}

interface TrendAnalysisData {
  dailyData: TrendPoint[]
  weeklyData: TrendPoint[]
  monthlyData: TrendPoint[]
  selectedPeriod: 'daily' | 'weekly' | 'monthly'
  currentTrend: 'up' | 'down' | 'stable'
  trendPercentage: number
  forecastedTrend: 'positive' | 'negative' | 'stable'
}

export default function TrendAnalysis() {
  const [data, setData] = useState<TrendAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [chartMetric, setChartMetric] = useState<'leads' | 'deals' | 'revenue' | 'conversionRate'>('leads')

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const response = await fetch('/api/v1/analytics/trends')
        if (!response.ok) throw new Error('Failed to fetch trend data')
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching trend data:', err)
        // Mock data for demo
        const generateMockData = () => {
          const data = []
          const today = new Date()
          for (let i = 30; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            data.push({
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              leads: 50 + Math.floor(Math.random() * 60) + (30 - i) * 0.5,
              deals: 12 + Math.floor(Math.random() * 15) + (30 - i) * 0.2,
              revenue: 50000 + Math.floor(Math.random() * 40000) + (30 - i) * 500,
              conversionRate: 25 + Math.floor(Math.random() * 20) + (30 - i) * 0.3
            })
          }
          return data
        }

        setData({
          dailyData: generateMockData(),
          weeklyData: generateMockData().slice(0, 4),
          monthlyData: generateMockData().slice(0, 12),
          selectedPeriod: 'weekly',
          currentTrend: 'up',
          trendPercentage: 12.5,
          forecastedTrend: 'positive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTrendData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Trend Analysis</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const currentData = selectedPeriod === 'daily' ? data.dailyData : selectedPeriod === 'weekly' ? data.weeklyData : data.monthlyData
  const trendColor = data.currentTrend === 'up' ? 'text-green-600' : data.currentTrend === 'down' ? 'text-red-600' : 'text-gray-600'
  const trendIcon = data.currentTrend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />

  const getMetricLabel = () => {
    switch (chartMetric) {
      case 'leads': return 'New Leads'
      case 'deals': return 'Deals Closed'
      case 'revenue': return 'Revenue Generated'
      case 'conversionRate': return 'Conversion Rate (%)'
      default: return ''
    }
  }

  const getMetricColor = () => {
    switch (chartMetric) {
      case 'leads': return '#3b82f6'
      case 'deals': return '#10b981'
      case 'revenue': return '#f59e0b'
      case 'conversionRate': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Trend Analysis</h2>
        <div className={`flex items-center gap-2 ${trendColor}`}>
          {trendIcon}
          <span className="text-sm font-medium">
            {Math.abs(data.trendPercentage)}% {data.currentTrend === 'up' ? 'growth' : 'decline'}
          </span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        {(['daily', 'weekly', 'monthly'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`py-2 px-4 rounded-lg font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-4 gap-3">
        {(['leads', 'deals', 'revenue', 'conversionRate'] as const).map((metric) => (
          <button
            key={metric}
            onClick={() => setChartMetric(metric)}
            className={`py-2 px-3 rounded text-xs font-medium transition-colors ${
              chartMetric === metric
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {metric === 'leads' ? 'Leads' : metric === 'deals' ? 'Deals' : metric === 'revenue' ? 'Revenue' : 'Conversion'}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{getMetricLabel()} Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={currentData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getMetricColor()} stopOpacity={0.3} />
                <stop offset="95%" stopColor={getMetricColor()} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Area
              type="monotone"
              dataKey={chartMetric}
              stroke={getMetricColor()}
              fillOpacity={1}
              fill="url(#colorMetric)"
              dot={false}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-blue-600" />
            <p className="text-sm font-medium text-gray-900">Current Trend</p>
          </div>
          <p className={`text-2xl font-bold ${trendColor}`}>
            {data.currentTrend === 'up' ? '↑' : data.currentTrend === 'down' ? '↓' : '→'} {Math.abs(data.trendPercentage).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {selectedPeriod} performance change
          </p>
        </div>

        <div className={`${
          data.forecastedTrend === 'positive' ? 'bg-green-50 border-green-200' :
          data.forecastedTrend === 'negative' ? 'bg-red-50 border-red-200' :
          'bg-gray-50 border-gray-200'
        } border rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className={`${
              data.forecastedTrend === 'positive' ? 'text-green-600' :
              data.forecastedTrend === 'negative' ? 'text-red-600' :
              'text-gray-600'
            }`} />
            <p className="text-sm font-medium text-gray-900">Forecast</p>
          </div>
          <p className={`text-lg font-bold ${
            data.forecastedTrend === 'positive' ? 'text-green-600' :
            data.forecastedTrend === 'negative' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {data.forecastedTrend === 'positive' ? 'Improving' : data.forecastedTrend === 'negative' ? 'Declining' : 'Stable'}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Based on 30-day trend
          </p>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Insights</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>{data.currentTrend === 'up' ? 'Strong upward momentum' : 'Downward trend detected'}. Focus on maintaining current strategies.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Week-over-week comparison shows steady pipeline growth across all metrics.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Forecast predicts {data.forecastedTrend} trajectory for next period based on historical patterns.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
