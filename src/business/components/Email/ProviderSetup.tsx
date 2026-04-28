/**
 * Provider Setup Component
 * Configure Resend, SMTP, AWS SES, SendGrid, etc.
 */

import React, { useState } from 'react';
import { AlertCircle, Save, X, Eye, EyeOff } from 'lucide-react';
import { setupEmailProvider, EmailProviderConfig } from '@/app/api/email';

interface ProviderSetupProps {
  businessId: string;
  provider?: EmailProviderConfig;
  onSave?: (provider: EmailProviderConfig) => void;
  onCancel?: () => void;
}

interface ProviderFormData {
  provider_type: 'resend' | 'smtp' | 'aws_ses' | 'sendgrid' | 'mailchimp' | 'brevo';
  provider_name?: string;
  config_json: Record<string, any>;
  daily_limit?: number;
  monthly_limit?: number;
}

const PROVIDER_CONFIGS: Record<string, { label: string; fields: Array<{ name: string; label: string; type: string; required: boolean; help?: string }> }> = {
  resend: {
    label: 'Resend',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
        help: 'Your Resend API key from dashboard.resend.com',
      },
      {
        name: 'domain',
        label: 'From Domain',
        type: 'text',
        required: true,
        help: 'Domain verified in your Resend account',
      },
    ],
  },
  smtp: {
    label: 'SMTP Server',
    fields: [
      {
        name: 'host',
        label: 'SMTP Host',
        type: 'text',
        required: true,
        help: 'e.g., smtp.gmail.com',
      },
      {
        name: 'port',
        label: 'Port',
        type: 'number',
        required: true,
        help: 'Usually 587 (TLS) or 465 (SSL)',
      },
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
      },
      {
        name: 'from_email',
        label: 'From Email',
        type: 'email',
        required: true,
      },
      {
        name: 'use_tls',
        label: 'Use TLS',
        type: 'checkbox',
        required: false,
        help: 'Enable TLS encryption',
      },
    ],
  },
  aws_ses: {
    label: 'AWS SES',
    fields: [
      {
        name: 'access_key_id',
        label: 'Access Key ID',
        type: 'password',
        required: true,
      },
      {
        name: 'secret_access_key',
        label: 'Secret Access Key',
        type: 'password',
        required: true,
      },
      {
        name: 'region',
        label: 'AWS Region',
        type: 'text',
        required: true,
        help: 'e.g., us-east-1',
      },
      {
        name: 'from_email',
        label: 'From Email (Verified)',
        type: 'email',
        required: true,
      },
    ],
  },
  sendgrid: {
    label: 'SendGrid',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
      },
      {
        name: 'from_email',
        label: 'From Email',
        type: 'email',
        required: true,
      },
      {
        name: 'from_name',
        label: 'From Name',
        type: 'text',
        required: false,
      },
    ],
  },
  mailchimp: {
    label: 'Mailchimp',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
      },
      {
        name: 'server_prefix',
        label: 'Server Prefix',
        type: 'text',
        required: true,
        help: 'e.g., us1, us2 (last part of server URL)',
      },
    ],
  },
  brevo: {
    label: 'Brevo (formerly Sendinblue)',
    fields: [
      {
        name: 'api_key',
        label: 'API Key v3',
        type: 'password',
        required: true,
      },
      {
        name: 'from_email',
        label: 'From Email (Verified)',
        type: 'email',
        required: true,
      },
      {
        name: 'from_name',
        label: 'From Name',
        type: 'text',
        required: false,
      },
    ],
  },
};

export const ProviderSetup: React.FC<ProviderSetupProps> = ({
  businessId,
  provider,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ProviderFormData>({
    provider_type: provider?.provider_type || 'resend',
    provider_name: provider?.provider_name || '',
    config_json: provider?.config_json || {},
    daily_limit: provider?.daily_limit || undefined,
    monthly_limit: provider?.monthly_limit || undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const currentProviderConfig = PROVIDER_CONFIGS[formData.provider_type];

  const handleProviderTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newType = e.target.value as ProviderFormData['provider_type'];
    setFormData(prev => ({
      ...prev,
      provider_type: newType,
      config_json: {},
    }));
  };

  const handleConfigChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config_json: {
        ...prev.config_json,
        [fieldName]: value,
      },
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (name === 'daily_limit' || name === 'monthly_limit') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : undefined,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.provider_type) {
        setError('Provider type is required');
        return;
      }

      // Validate required fields
      const requiredFields = currentProviderConfig.fields.filter(f => f.required);
      for (const field of requiredFields) {
        if (!formData.config_json[field.name]) {
          setError(`${field.label} is required`);
          return;
        }
      }

      setLoading(true);
      setError(null);

      const savedProvider = await setupEmailProvider(businessId, formData);
      onSave?.(savedProvider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save provider');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          {provider ? 'Edit Provider' : 'Add Email Provider'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border-b border-red-200 mx-6 mt-6 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="p-6 space-y-6">
        {/* Provider Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Service Provider *
          </label>
          <select
            value={formData.provider_type}
            onChange={handleProviderTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        {/* Provider Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider Name (for your reference)
          </label>
          <input
            type="text"
            name="provider_name"
            value={formData.provider_name || ''}
            onChange={handleInputChange}
            placeholder="e.g., Production, Backup"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Provider-Specific Fields */}
        <div className="space-y-4">
          {currentProviderConfig.fields.map(field => {
            const fieldValue = formData.config_json[field.name] || '';
            const isPassword = field.type === 'password';
            const showPassword = showPasswords[field.name];

            if (field.type === 'checkbox') {
              return (
                <label key={field.name} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.config_json[field.name] || false}
                    onChange={(e) => handleConfigChange(field.name, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{field.label}</span>
                  {field.help && (
                    <span className="text-xs text-gray-500 ml-2">({field.help})</span>
                  )}
                </label>
              );
            }

            return (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-600">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={isPassword && !showPassword ? 'password' : field.type}
                    value={fieldValue}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    placeholder={field.help || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  {isPassword && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field.name)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                {field.help && !field.type?.includes('checkbox') && (
                  <p className="text-xs text-gray-500 mt-1">{field.help}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Rate Limits */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Rate Limits (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Limit
              </label>
              <input
                type="number"
                name="daily_limit"
                value={formData.daily_limit || ''}
                onChange={handleInputChange}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Limit
              </label>
              <input
                type="number"
                name="monthly_limit"
                value={formData.monthly_limit || ''}
                onChange={handleInputChange}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Provider'}
        </button>
      </div>
    </div>
  );
};
