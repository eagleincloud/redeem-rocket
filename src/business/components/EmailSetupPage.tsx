import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusiness } from '../context/BusinessContext';
import {
  fetchEmailProviderConfigs,
  createEmailProviderConfig,
  updateEmailProviderConfig,
  deleteEmailProviderConfig,
} from '@/app/api/supabase-data';

type ProviderType = 'smtp' | 'ses' | 'resend';
type Tab = 'providers' | 'dns' | 'test';

interface EmailProvider {
  id: string;
  provider_type: string;
  provider_name: string;
  is_verified: boolean;
  is_primary: boolean;
  verified_domain?: string;
}

export const EmailSetupPage: React.FC = () => {
  const { isDark } = useTheme();
  const { businessId } = useBusiness();
  const [activeTab, setActiveTab] = useState<Tab>('providers');
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProviderForm, setShowNewProviderForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('resend');
  const [formData, setFormData] = useState({
    provider_name: '',
    resend_api_key: '',
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: '',
    aws_access_key: '',
    aws_secret: '',
    verified_domain: '',
  });

  const colors = {
    bg: isDark ? '#0b1220' : '#ffffff',
    card: isDark ? '#111827' : '#f9fafb',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)',
    text: isDark ? '#f1f5f9' : '#1f2937',
    textMuted: isDark ? '#6b7280' : '#6b7280',
    primary: '#6366f1',
    accent: '#F97316',
  };

  useEffect(() => {
    loadProviders();
  }, [businessId]);

  const loadProviders = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await fetchEmailProviderConfigs(businessId);
      setProviders(data as EmailProvider[]);
    } catch (err) {
      console.error('Load providers failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async () => {
    if (!businessId) return;

    const configData =
      selectedProvider === 'resend'
        ? { resend_api_key: formData.resend_api_key }
        : selectedProvider === 'smtp'
          ? {
              smtp_host: formData.smtp_host,
              smtp_port: formData.smtp_port,
              smtp_user: formData.smtp_user,
              smtp_pass: formData.smtp_pass,
            }
          : {
              aws_access_key: formData.aws_access_key,
              aws_secret: formData.aws_secret,
            };

    try {
      await createEmailProviderConfig(businessId, {
        provider_type: selectedProvider,
        provider_name: formData.provider_name || selectedProvider.toUpperCase(),
        config_data: configData,
      });
      setFormData({
        provider_name: '',
        resend_api_key: '',
        smtp_host: '',
        smtp_port: '',
        smtp_user: '',
        smtp_pass: '',
        aws_access_key: '',
        aws_secret: '',
        verified_domain: '',
      });
      setShowNewProviderForm(false);
      await loadProviders();
    } catch (err) {
      console.error('Add provider failed:', err);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    try {
      await deleteEmailProviderConfig(providerId);
      await loadProviders();
    } catch (err) {
      console.error('Delete provider failed:', err);
    }
  };

  const handleSetPrimary = async (providerId: string) => {
    try {
      await updateEmailProviderConfig(providerId, { is_primary: true });
      // Clear primary from others
      for (const p of providers) {
        if (p.id !== providerId && p.is_primary) {
          await updateEmailProviderConfig(p.id, { is_primary: false });
        }
      }
      await loadProviders();
    } catch (err) {
      console.error('Set primary failed:', err);
    }
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: colors.bg }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, margin: '0 0 8px 0' }}>
          Email Setup
        </h1>
        <p style={{ fontSize: '14px', color: colors.textMuted, margin: 0 }}>
          Configure email providers, verify domains, and test deliverability
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
        {(['providers', 'dns', 'test'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab ? colors.primary : colors.textMuted,
              borderBottom: activeTab === tab ? `2px solid ${colors.primary}` : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '500',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, margin: 0 }}>
              Email Providers
            </h2>
            <button
              onClick={() => setShowNewProviderForm(!showNewProviderForm)}
              style={{
                padding: '8px 16px',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {showNewProviderForm ? 'Cancel' : '+ Add Provider'}
            </button>
          </div>

          {showNewProviderForm && (
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginTop: 0 }}>
                Add New Provider
              </h3>

              {/* Provider Type Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '8px' }}>
                  Provider Type
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {(['resend', 'smtp', 'ses'] as const).map((type) => (
                    <label
                      key={type}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      <input
                        type="radio"
                        name="provider_type"
                        value={type}
                        checked={selectedProvider === type}
                        onChange={(e) => setSelectedProvider(e.target.value as ProviderType)}
                        style={{ cursor: 'pointer' }}
                      />
                      {type.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>

              {/* Provider Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                  Provider Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Main Email Provider"
                  value={formData.provider_name}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Resend Config */}
              {selectedProvider === 'resend' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                    Resend API Key
                  </label>
                  <input
                    type="password"
                    placeholder="re_..."
                    value={formData.resend_api_key}
                    onChange={(e) => setFormData({ ...formData, resend_api_key: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      color: colors.text,
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* SMTP Config */}
              {selectedProvider === 'smtp' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      placeholder="smtp.example.com"
                      value={formData.smtp_host}
                      onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        color: colors.text,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                        Port
                      </label>
                      <input
                        type="text"
                        placeholder="587"
                        value={formData.smtp_port}
                        onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          color: colors.text,
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      placeholder="your-email@example.com"
                      value={formData.smtp_user}
                      onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        color: colors.text,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                      SMTP Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={formData.smtp_pass}
                      onChange={(e) => setFormData({ ...formData, smtp_pass: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        color: colors.text,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </>
              )}

              {/* SES Config */}
              {selectedProvider === 'ses' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                      AWS Access Key ID
                    </label>
                    <input
                      type="password"
                      placeholder="AKIA..."
                      value={formData.aws_access_key}
                      onChange={(e) => setFormData({ ...formData, aws_access_key: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        color: colors.text,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                      AWS Secret Access Key
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={formData.aws_secret}
                      onChange={(e) => setFormData({ ...formData, aws_secret: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        color: colors.text,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleAddProvider}
                style={{
                  padding: '8px 16px',
                  background: colors.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Add Provider
              </button>
            </div>
          )}

          {/* Providers List */}
          {loading ? (
            <p style={{ color: colors.textMuted }}>Loading providers...</p>
          ) : providers.length === 0 ? (
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: colors.textMuted, margin: 0 }}>No providers configured yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, margin: '0 0 4px 0' }}>
                      {provider.provider_name}
                    </h3>
                    <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
                      {provider.provider_type.toUpperCase()}
                      {provider.is_verified && <span style={{ color: colors.accent, marginLeft: '8px' }}>✓ Verified</span>}
                      {provider.is_primary && <span style={{ color: colors.primary, marginLeft: '8px' }}>★ Primary</span>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!provider.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(provider.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          color: colors.primary,
                          border: `1px solid ${colors.primary}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProvider(provider.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        color: colors.accent,
                        border: `1px solid ${colors.accent}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DNS Tab */}
      {activeTab === 'dns' && (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, margin: '0 0 16px 0' }}>
            DNS Records
          </h2>
          <p style={{ color: colors.textMuted, marginBottom: '16px' }}>
            Add these DNS records to verify domain ownership and improve deliverability:
          </p>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0', padding: '12px', borderRadius: '6px' }}>
              <p style={{ fontSize: '13px', fontWeight: '500', color: colors.text, margin: '0 0 4px 0' }}>SPF Record</p>
              <code style={{ fontSize: '12px', color: colors.textMuted, wordBreak: 'break-all' }}>
                v=spf1 include:sendgrid.net ~all
              </code>
            </div>
            <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0', padding: '12px', borderRadius: '6px' }}>
              <p style={{ fontSize: '13px', fontWeight: '500', color: colors.text, margin: '0 0 4px 0' }}>DKIM Record</p>
              <code style={{ fontSize: '12px', color: colors.textMuted, wordBreak: 'break-all' }}>
                default._domainkey.{'{domain}'}.com CNAME {'{dkim_key}'}.dkim.sendgrid.net
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, margin: '0 0 16px 0' }}>
            Test Email Delivery
          </h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
              Recipient Email
            </label>
            <input
              type="email"
              placeholder="test@example.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            style={{
              padding: '8px 16px',
              background: colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            Send Test Email
          </button>
        </div>
      )}
    </div>
  );
};
