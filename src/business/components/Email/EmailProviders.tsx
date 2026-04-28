/**
 * Email Providers Component
 * List and manage configured email providers (Resend, SMTP, AWS SES, etc.)
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, Trash2, Edit2, CheckCircle, XCircle, Plus, Mail } from 'lucide-react';
import {
  getEmailProviders,
  deleteEmailProvider,
  setPrimaryEmailProvider,
  EmailProviderConfig,
} from '@/app/api/email';

interface EmailProvidersProps {
  businessId: string;
  onSelectProvider?: (provider: EmailProviderConfig) => void;
  onCreateNew?: () => void;
}

export const EmailProviders: React.FC<EmailProvidersProps> = ({
  businessId,
  onSelectProvider,
  onCreateNew,
}) => {
  const [providers, setProviders] = useState<EmailProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, [businessId]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await getEmailProviders(businessId);
      setProviders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!window.confirm('Are you sure you want to delete this provider?')) return;

    try {
      setDeletingId(providerId);
      await deleteEmailProvider(providerId);
      loadProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (providerId: string) => {
    try {
      await setPrimaryEmailProvider(businessId, providerId);
      loadProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary provider');
    }
  };

  const getProviderIcon = (type: string) => {
    const icons: Record<string, string> = {
      resend: '📧',
      smtp: '🔧',
      aws_ses: '☁️',
      sendgrid: '📬',
      mailchimp: '🎯',
      brevo: '🚀',
    };
    return icons[type] || '📧';
  };

  const getProviderLabel = (type: string) => {
    const labels: Record<string, string> = {
      resend: 'Resend',
      smtp: 'SMTP',
      aws_ses: 'AWS SES',
      sendgrid: 'SendGrid',
      mailchimp: 'Mailchimp',
      brevo: 'Brevo',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin mb-4 text-2xl">⚙️</div>
          <p className="text-gray-600">Loading providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Email Providers</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Provider
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {providers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No email providers configured yet</p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Configure Your First Provider
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              {/* Provider Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getProviderIcon(provider.provider_type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {provider.provider_name || getProviderLabel(provider.provider_type)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getProviderLabel(provider.provider_type)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {provider.is_primary && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Primary
                    </span>
                  )}
                  {provider.is_verified && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {!provider.is_verified && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>

              {/* Provider Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium text-gray-900">
                    {provider.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Verified Domain</p>
                  <p className="font-medium text-gray-900">
                    {provider.verified_domain || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sent Today</p>
                  <p className="font-medium text-gray-900">
                    {provider.emails_sent_today}
                    {provider.daily_limit && `/${provider.daily_limit}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sent This Month</p>
                  <p className="font-medium text-gray-900">
                    {provider.emails_sent_this_month}
                    {provider.monthly_limit && `/${provider.monthly_limit}`}
                  </p>
                </div>
              </div>

              {/* Error Message if Present */}
              {provider.last_error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Last Error:</strong> {provider.last_error}
                </div>
              )}

              {/* Rate Limiting Info */}
              {provider.daily_limit && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Daily Limit</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition"
                      style={{
                        width: `${Math.min(
                          (provider.emails_sent_today / provider.daily_limit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-between">
                <div className="flex gap-2">
                  {!provider.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(provider.id)}
                      className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                    >
                      Set as Primary
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectProvider?.(provider)}
                    className="p-2 hover:bg-gray-200 rounded transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteProvider(provider.id)}
                    disabled={deletingId === provider.id}
                    className="p-2 hover:bg-gray-200 rounded transition disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
