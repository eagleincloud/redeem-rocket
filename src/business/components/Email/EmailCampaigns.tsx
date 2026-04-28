/**
 * Email Campaigns List Component
 * Displays campaigns with stats (sent, open rate, click rate)
 * Supports filtering, sorting, and bulk actions
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Clock, Send, Trash2, Edit2, Play, Pause } from 'lucide-react';
import { getCampaigns, updateCampaign, deleteCampaign } from '@/app/api/email';
import { EmailCampaign } from '@/app/api/email';

interface EmailCampaignsProps {
  businessId: string;
  onSelectCampaign?: (campaign: EmailCampaign) => void;
  onCreateNew?: () => void;
}

export const EmailCampaigns: React.FC<EmailCampaignsProps> = ({
  businessId,
  onSelectCampaign,
  onCreateNew,
}) => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCampaigns();
  }, [businessId, statusFilter]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const { campaigns: data } = await getCampaigns(businessId, {
        status: statusFilter,
        limit: 100,
      });
      setCampaigns(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'sending' || currentStatus === 'sent' ? 'paused' : 'sending';
      await updateCampaign(campaignId, { status: newStatus as any });
      loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;

    try {
      await deleteCampaign(campaignId);
      loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
    }
  };

  const handleSelectCampaign = (campaignId: string) => {
    const newSelected = new Set(selectedCampaigns);
    if (newSelected.has(campaignId)) {
      newSelected.delete(campaignId);
    } else {
      newSelected.add(campaignId);
    }
    setSelectedCampaigns(newSelected);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      paused: 'bg-orange-100 text-orange-800',
      archived: 'bg-gray-300 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Draft',
      scheduled: 'Scheduled',
      sending: 'Sending',
      sent: 'Sent',
      paused: 'Paused',
      archived: 'Archived',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin mb-4 text-2xl">⚙️</div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Email Campaigns</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Send className="w-4 h-4 inline mr-2" />
          New Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`px-4 py-2 rounded-lg transition ${
            statusFilter === undefined
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        {['draft', 'scheduled', 'sending', 'sent', 'paused'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg transition capitalize ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Campaigns Table */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No campaigns yet</p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Campaign
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCampaigns(new Set(campaigns.map(c => c.id)));
                      } else {
                        setSelectedCampaigns(new Set());
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Subject</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Sent</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Open Rate</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Click Rate</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const openRate = campaign.sent_count > 0
                  ? ((campaign.open_count / campaign.sent_count) * 100).toFixed(1)
                  : 0;
                const clickRate = campaign.sent_count > 0
                  ? ((campaign.click_count / campaign.sent_count) * 100).toFixed(1)
                  : 0;

                return (
                  <tr
                    key={campaign.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.has(campaign.id)}
                        onChange={() => handleSelectCampaign(campaign.id)}
                      />
                    </td>
                    <td
                      className="px-6 py-4 font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => onSelectCampaign?.(campaign)}
                    >
                      {campaign.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-xs">
                      {campaign.subject}
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {campaign.sent_count}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {openRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {clickRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {getStatusLabel(campaign.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleToggleCampaignStatus(campaign.id, campaign.status)}
                          className="p-2 hover:bg-gray-200 rounded transition"
                          title={campaign.status === 'sending' || campaign.status === 'sent' ? 'Pause' : 'Resume'}
                        >
                          {campaign.status === 'sending' || campaign.status === 'sent' ? (
                            <Pause className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Play className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => onSelectCampaign?.(campaign)}
                          className="p-2 hover:bg-gray-200 rounded transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="p-2 hover:bg-gray-200 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
