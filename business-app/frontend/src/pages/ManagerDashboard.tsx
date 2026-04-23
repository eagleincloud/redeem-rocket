import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { useAuthStore } from '../stores/authStore'

interface ManagerProfile {
  id: string
  name: string
  email: string
  specializations: string[]
  expertise_level: string
  availability_status: string
  current_workload: number
  max_concurrent_leads: number
  target_response_time_minutes: number
  target_close_rate_percent: number
  target_satisfaction_score: number
}

interface ManagerAssignment {
  id: string
  lead_id: string
  assigned_at: string
  status: string
  response_time_minutes?: number
  interaction_count: number
  satisfaction_score?: number
}

interface AIRecommendation {
  id: string
  entity_type: string
  recommendation_text: string
  action_type: string
  priority: string
  confidence_score: number
  is_accepted: boolean
}

export default function ManagerDashboard() {
  const { user } = useAuthStore()
  const [managerProfile, setManagerProfile] = useState<ManagerProfile | null>(null)
  const [assignments, setAssignments] = useState<ManagerAssignment[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadManagerData = async () => {
      try {
        if (!user?.id) {
          setError('User not authenticated')
          return
        }

        // Get manager profile
        const { data: profile, error: profileError } = await supabase
          .from('manager_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError
        }

        if (profile) {
          setManagerProfile(profile as ManagerProfile)

          // Get manager assignments
          const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('manager_assignments')
            .select('*')
            .eq('manager_id', profile.id)
            .eq('status', 'active')
            .order('assigned_at', { ascending: false })

          if (assignmentsError) throw assignmentsError
          setAssignments((assignmentsData || []) as ManagerAssignment[])

          // Get AI recommendations
          const { data: recommendationsData, error: recommendationsError } = await supabase
            .from('ai_recommendations')
            .select('*')
            .eq('business_id', profile.business_id)
            .eq('is_accepted', false)
            .order('created_at', { ascending: false })
            .limit(10)

          if (recommendationsError) throw recommendationsError
          setRecommendations((recommendationsData || []) as AIRecommendation[])
        }
      } catch (err) {
        console.error('Error loading manager data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load manager data')
      } finally {
        setLoading(false)
      }
    }

    loadManagerData()
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !managerProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-800 mb-2">Error Loading Manager Dashboard</h1>
            <p className="text-red-700">{error || 'You are not configured as a manager'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage assignments, track performance, and review AI recommendations</p>
        </div>

        {/* Manager Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{managerProfile.name}</h2>
              <p className="text-gray-600">{managerProfile.email}</p>
              <div className="mt-4 flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-500">Expertise Level</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{managerProfile.expertise_level}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`text-lg font-semibold capitalize ${
                    managerProfile.availability_status === 'available' ? 'text-green-600' :
                    managerProfile.availability_status === 'busy' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {managerProfile.availability_status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Workload</p>
                  <p className="text-lg font-semibold text-gray-900">{managerProfile.current_workload} / {managerProfile.max_concurrent_leads}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Avg Response Time</h3>
            <p className="text-3xl font-bold text-gray-900">{managerProfile.target_response_time_minutes}m</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Target Close Rate</h3>
            <p className="text-3xl font-bold text-gray-900">{managerProfile.target_close_rate_percent}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Satisfaction Score</h3>
            <p className="text-3xl font-bold text-gray-900">{managerProfile.target_satisfaction_score.toFixed(1)} ⭐</p>
          </div>
        </div>

        {/* Active Assignments */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Active Assignments ({assignments.length})</h3>
          {assignments.length === 0 ? (
            <p className="text-gray-600">No active assignments</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Lead ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Assigned Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Interactions</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Satisfaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">{assignment.lead_id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{assignment.interaction_count}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {assignment.satisfaction_score ? assignment.satisfaction_score.toFixed(1) : '—'} ⭐
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">AI Recommendations ({recommendations.length})</h3>
          {recommendations.length === 0 ? (
            <p className="text-gray-600">No pending recommendations</p>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{rec.recommendation_text}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: <span className="font-mono">{rec.action_type}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority}
                      </span>
                      <span className="text-sm text-gray-600">{(rec.confidence_score * 100).toFixed(0)}% confident</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
