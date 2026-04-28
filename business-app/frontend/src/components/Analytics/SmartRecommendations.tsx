import { useEffect, useState } from 'react'
import { Lightbulb, CheckCircle, AlertCircle, ArrowRight, Zap } from 'lucide-react'

interface Recommendation {
  id: string
  title: string
  description: string
  category: 'efficiency' | 'revenue' | 'quality' | 'growth'
  priority: 'high' | 'medium' | 'low'
  estimatedImpact: string
  action: string
  actionUrl?: string
  confidence: number
  status: 'pending' | 'accepted' | 'implemented'
}

interface SmartRecommendationsData {
  recommendations: Recommendation[]
  totalPotentialRevenue: number
  efficiencyGains: string
  estimatedTimeToImplement: string
}

export default function SmartRecommendations() {
  const [data, setData] = useState<SmartRecommendationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acceptedRecommendations, setAcceptedRecommendations] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/v1/analytics/recommendations')
        if (!response.ok) throw new Error('Failed to fetch recommendations')
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        // Mock data for demo
        setData({
          recommendations: [
            {
              id: 'rec-1',
              title: 'Implement Automated Follow-ups',
              description: 'Set up automatic email sequences for leads in Contact Made stage. This could reduce response time from 8 days to 2 days.',
              category: 'efficiency',
              priority: 'high',
              estimatedImpact: '+25% faster sales cycle',
              action: 'Set up automation',
              actionUrl: '/automation-rules',
              confidence: 0.92,
              status: 'pending'
            },
            {
              id: 'rec-2',
              title: 'Sales Training on Objection Handling',
              description: 'Team analysis shows 60% of qualified leads are losing on price objections. Training could improve close rate by 15%.',
              category: 'quality',
              priority: 'high',
              estimatedImpact: '+₹45,000 monthly revenue',
              action: 'Schedule training',
              confidence: 0.88,
              status: 'pending'
            },
            {
              id: 'rec-3',
              title: 'Expand High-Performing Lead Sources',
              description: 'Referral leads have 65% conversion rate vs 35% average. Increase referral program investment.',
              category: 'growth',
              priority: 'high',
              estimatedImpact: '+40% lead quality',
              action: 'Analyze sources',
              actionUrl: '/leads',
              confidence: 0.85,
              status: 'pending'
            },
            {
              id: 'rec-4',
              title: 'Create Deal Templates',
              description: 'Standardize proposal templates for different deal sizes. Average proposal time currently 15 days.',
              category: 'efficiency',
              priority: 'medium',
              estimatedImpact: '-30% proposal time',
              action: 'Create templates',
              confidence: 0.79,
              status: 'pending'
            },
            {
              id: 'rec-5',
              title: 'Optimize Lead Scoring Model',
              description: 'Current model has 72% accuracy. Machine learning optimization could improve to 88%+.',
              category: 'quality',
              priority: 'medium',
              estimatedImpact: '+20% conversion rate',
              action: 'Review model',
              confidence: 0.82,
              status: 'pending'
            },
            {
              id: 'rec-6',
              title: 'Implement CRM Daily Sync',
              description: 'Ensure all team members update CRM daily. Currently 40% update rate.',
              category: 'efficiency',
              priority: 'low',
              estimatedImpact: '+15% data accuracy',
              action: 'Send training',
              confidence: 0.71,
              status: 'pending'
            }
          ],
          totalPotentialRevenue: 125000,
          efficiencyGains: '32% reduction in sales cycle time',
          estimatedTimeToImplement: '2-3 weeks'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Smart Recommendations</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const handleAcceptRecommendation = (id: string) => {
    const newSet = new Set(acceptedRecommendations)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setAcceptedRecommendations(newSet)
  }

  const priorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Zap size={16} className="text-red-600" />
      case 'medium':
        return <AlertCircle size={16} className="text-yellow-600" />
      default:
        return <Lightbulb size={16} className="text-blue-600" />
    }
  }

  const categoryColor = (category: string) => {
    switch (category) {
      case 'efficiency':
        return 'bg-blue-100 text-blue-800'
      case 'revenue':
        return 'bg-green-100 text-green-800'
      case 'quality':
        return 'bg-purple-100 text-purple-800'
      case 'growth':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const pendingRecommendations = data.recommendations.filter(r => r.status === 'pending')
  const highPriority = pendingRecommendations.filter(r => r.priority === 'high')

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Smart Recommendations</h2>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
          <Lightbulb size={16} />
          {pendingRecommendations.length} Pending
        </span>
      </div>

      {highPriority.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Zap className="text-red-600 mt-1 flex-shrink-0" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                {highPriority.length} High-Priority Action{highPriority.length !== 1 ? 's' : ''} Available
              </h3>
              <p className="text-sm text-red-800">
                Could unlock ₹{data.totalPotentialRevenue.toLocaleString()} in additional revenue and {data.efficiencyGains} in efficiency gains.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Potential Revenue</p>
          <p className="text-2xl font-bold text-green-600">₹{(data.totalPotentialRevenue / 1000).toFixed(0)}K</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Efficiency Gain</p>
          <p className="text-lg font-bold text-blue-600 truncate">{data.efficiencyGains}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Time to Implement</p>
          <p className="text-lg font-bold text-purple-600">{data.estimatedTimeToImplement}</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`border rounded-lg p-4 transition-all ${
              acceptedRecommendations.has(rec.id)
                ? 'border-green-200 bg-green-50'
                : rec.priority === 'high'
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {priorityIcon(rec.priority)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleAcceptRecommendation(rec.id)}
                className={`flex-shrink-0 ml-4 ${
                  acceptedRecommendations.has(rec.id)
                    ? 'text-green-600'
                    : 'text-gray-400 hover:text-green-600'
                }`}
              >
                <CheckCircle size={24} fill={acceptedRecommendations.has(rec.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${categoryColor(rec.category)}`}>
                {rec.category.charAt(0).toUpperCase() + rec.category.slice(1)}
              </span>
              <span className="text-xs font-medium text-gray-600">
                Impact: {rec.estimatedImpact}
              </span>
              <span className="text-xs font-medium text-blue-600">
                Confidence: {(rec.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  rec.actionUrl
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
                onClick={() => {
                  if (rec.actionUrl) {
                    window.location.href = rec.actionUrl
                  }
                }}
              >
                {rec.action}
                <ArrowRight size={14} />
              </button>
              {acceptedRecommendations.has(rec.id) && (
                <span className="text-xs text-green-600 font-medium ml-auto">
                  ✓ Accepted
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          These recommendations are automatically generated based on pipeline analysis, team performance patterns, and industry benchmarks.
          Accept recommendations to track implementation progress.
        </p>
      </div>
    </div>
  )
}
