import { useNavigate } from 'react-router-dom'

export default function LeadManagementDashboard() {
  const navigate = useNavigate()

  const stats = {
    totalLeads: 456, newLeads: 28, qualifiedLeads: 142, wonLeads: 89,
    activeCampaigns: 5, emailsSent: 2150, activeRules: 12, socialAccounts: 3,
  }

  const recentLeads = [
    { id: 'L-001', name: 'John Enterprise', company: 'Tech Corp', stage: 'Qualified', value: 25000, source: 'Website' },
    { id: 'L-002', name: 'Sarah Growth', company: 'Digital Inc', stage: 'Proposal', value: 18500, source: 'Referral' },
    { id: 'L-003', name: 'Mike Sales', company: 'Commerce Ltd', stage: 'Contact Made', value: 12000, source: 'Campaign' },
    { id: 'L-004', name: 'Emma Vision', company: 'Future Startup', stage: 'Lead', value: 8500, source: 'Scrape' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">👥 Lead Management System</h1>
          <p className="text-gray-600 mt-2">Growth Platform & Lead Automation</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Leads</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLeads}</p>
            <p className="text-blue-600 text-sm mt-4">+{stats.newLeads} new this month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Qualified Leads</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.qualifiedLeads}</p>
            <p className="text-green-600 text-sm mt-4">{Math.round((stats.qualifiedLeads / stats.totalLeads) * 100)}% conversion</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Active Campaigns</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeCampaigns}</p>
            <p className="text-purple-600 text-sm mt-4">{stats.emailsSent.toLocaleString()} emails sent</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Won Deals</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.wonLeads}</p>
            <p className="text-orange-600 text-sm mt-4">{Math.round((stats.wonLeads / stats.qualifiedLeads) * 100)}% close rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">Automation</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">Active Rules</span>
              <span className="text-2xl font-bold text-gray-900">{stats.activeRules}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">Social Media</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Connected Accounts</span>
              <span className="text-2xl font-bold text-gray-900">{stats.socialAccounts}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Leads</h2>
            <button onClick={() => navigate('/leads')} className="text-blue-600 hover:text-blue-700 font-medium text-sm">View All →</button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Source</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{lead.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.company}</td>
                  <td className="px-6 py-4 text-sm"><span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{lead.stage}</span></td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${lead.value.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <button onClick={() => navigate('/leads')} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-bold text-gray-900">Leads</h3>
            <p className="text-gray-600 text-sm mt-1">Manage all leads</p>
          </button>
          <button onClick={() => navigate('/email-campaigns')} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <div className="text-3xl mb-3">📧</div>
            <h3 className="font-bold text-gray-900">Campaigns</h3>
            <p className="text-gray-600 text-sm mt-1">Email sequences</p>
          </button>
          <button onClick={() => navigate('/automation-rules')} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-bold text-gray-900">Automation</h3>
            <p className="text-gray-600 text-sm mt-1">Workflow rules</p>
          </button>
          <button onClick={() => navigate('/social-accounts')} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-bold text-gray-900">Social Media</h3>
            <p className="text-gray-600 text-sm mt-1">Post & connect</p>
          </button>
        </div>
      </div>
    </div>
  )
}
