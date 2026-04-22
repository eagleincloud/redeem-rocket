import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusiness } from '../context/BusinessContext';
import {
  fetchLeadConnectors,
  createLeadConnector,
  updateLeadConnector,
  deleteLeadConnector,
} from '@/app/api/supabase-data';

type ConnectorType = 'csv_upload' | 'webhook' | 'form_embed' | 'api_key' | 'zapier';

interface LeadConnector {
  id: string;
  connector_name: string;
  connector_type: string;
  source_name?: string;
  webhook_url?: string;
  api_key?: string;
  form_embed_code?: string;
  is_active: boolean;
  sync_count: number;
  last_sync_at?: string;
}

export const ConnectorsPage: React.FC = () => {
  const { isDark } = useTheme();
  const { businessId } = useBusiness();
  const [connectors, setConnectors] = useState<LeadConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedType, setSelectedType] = useState<ConnectorType>('csv_upload');
  const [formData, setFormData] = useState({
    connector_name: '',
    source_name: '',
    webhook_url: '',
    api_key: '',
    form_embed_code: '',
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
    loadConnectors();
  }, [businessId]);

  const loadConnectors = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await fetchLeadConnectors(businessId);
      setConnectors(data as LeadConnector[]);
    } catch (err) {
      console.error('Load connectors failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnector = async () => {
    if (!businessId) return;

    try {
      await createLeadConnector(businessId, {
        connector_name: formData.connector_name,
        connector_type: selectedType,
        source_name: formData.source_name || undefined,
        webhook_url: formData.webhook_url || undefined,
        api_key: formData.api_key || undefined,
        form_embed_code: formData.form_embed_code || undefined,
      });

      setFormData({
        connector_name: '',
        source_name: '',
        webhook_url: '',
        api_key: '',
        form_embed_code: '',
      });
      setShowNewForm(false);
      await loadConnectors();
    } catch (err) {
      console.error('Add connector failed:', err);
    }
  };

  const handleDeleteConnector = async (connectorId: string) => {
    try {
      await deleteLeadConnector(connectorId);
      await loadConnectors();
    } catch (err) {
      console.error('Delete connector failed:', err);
    }
  };

  const handleToggleActive = async (connectorId: string, isActive: boolean) => {
    try {
      await updateLeadConnector(connectorId, { is_active: !isActive });
      await loadConnectors();
    } catch (err) {
      console.error('Toggle active failed:', err);
    }
  };

  const connectorIcons: Record<ConnectorType, string> = {
    csv_upload: '📄',
    webhook: '🔗',
    form_embed: '📋',
    api_key: '🔑',
    zapier: '⚡',
  };

  const connectorDescriptions: Record<ConnectorType, string> = {
    csv_upload: 'Import leads from CSV files',
    webhook: 'Receive leads via webhook',
    form_embed: 'Embed a form on your website',
    api_key: 'Use API to send leads',
    zapier: 'Connect via Zapier integration',
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: colors.bg }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, margin: '0 0 8px 0' }}>
          Lead Connectors
        </h1>
        <p style={{ fontSize: '14px', color: colors.textMuted, margin: 0 }}>
          Connect lead sources from CSV, webhooks, forms, and integrations
        </p>
      </div>

      {/* Add Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          style={{
            padding: '10px 20px',
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {showNewForm ? 'Cancel' : '+ Add Connector'}
        </button>
      </div>

      {/* New Connector Form */}
      {showNewForm && (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginTop: 0 }}>
            New Lead Connector
          </h3>

          {/* Connector Type Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '8px' }}>
              Connector Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
              {(['csv_upload', 'webhook', 'form_embed', 'api_key', 'zapier'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  style={{
                    padding: '12px',
                    background: selectedType === type ? colors.primary : colors.card,
                    color: selectedType === type ? 'white' : colors.text,
                    border: `1px solid ${selectedType === type ? colors.primary : colors.border}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    textAlign: 'center',
                  }}
                >
                  {connectorIcons[type]} {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Connector Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
              Connector Name
            </label>
            <input
              type="text"
              placeholder="e.g., Shopify Leads"
              value={formData.connector_name}
              onChange={(e) => setFormData({ ...formData, connector_name: e.target.value })}
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

          {/* Source Name */}
          {(selectedType === 'zapier' || selectedType === 'webhook') && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                Source Name
              </label>
              <input
                type="text"
                placeholder="e.g., Shopify, WooCommerce, Typeform"
                value={formData.source_name}
                onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
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

          {/* Webhook URL */}
          {selectedType === 'webhook' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                Webhook URL
              </label>
              <input
                type="text"
                placeholder="https://your-app.com/webhooks/leads"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
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

          {/* API Key */}
          {selectedType === 'api_key' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                API Key
              </label>
              <input
                type="password"
                placeholder="your-api-key"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
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

          {/* Form Embed Code */}
          {selectedType === 'form_embed' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                Form Embed Code
              </label>
              <textarea
                placeholder="Paste your form embed code here"
                value={formData.form_embed_code}
                onChange={(e) => setFormData({ ...formData, form_embed_code: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  minHeight: '100px',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          )}

          <button
            onClick={handleAddConnector}
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
            Create Connector
          </button>
        </div>
      )}

      {/* Connectors List */}
      {loading ? (
        <p style={{ color: colors.textMuted }}>Loading connectors...</p>
      ) : connectors.length === 0 ? (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>🔌</p>
          <p style={{ color: colors.textMuted, margin: 0 }}>No connectors yet. Add one to start importing leads.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {connectors.map((connector) => (
            <div
              key={connector.id}
              style={{
                background: colors.card,
                border: `1px solid ${connector.is_active ? colors.primary : colors.border}`,
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{connectorIcons[connector.connector_type as ConnectorType]}</span>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, margin: '0' }}>
                        {connector.connector_name}
                      </h3>
                      <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0 0' }}>
                        {connectorDescriptions[connector.connector_type as ConnectorType]}
                      </p>
                    </div>
                  </div>
                  {connector.source_name && (
                    <p style={{ fontSize: '12px', color: colors.textMuted, margin: '4px 0 0 26px' }}>
                      Source: {connector.source_name}
                    </p>
                  )}
                  {connector.webhook_url && (
                    <p style={{ fontSize: '11px', color: colors.textMuted, margin: '4px 0 0 26px', wordBreak: 'break-all' }}>
                      {connector.webhook_url}
                    </p>
                  )}
                  <p style={{ fontSize: '12px', color: colors.textMuted, margin: '4px 0 0 26px' }}>
                    {connector.sync_count} syncs
                    {connector.last_sync_at && ` • Last sync: ${new Date(connector.last_sync_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleToggleActive(connector.id, connector.is_active)}
                    style={{
                      padding: '6px 12px',
                      background: connector.is_active ? colors.primary : 'transparent',
                      color: connector.is_active ? 'white' : colors.textMuted,
                      border: `1px solid ${connector.is_active ? colors.primary : colors.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    {connector.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDeleteConnector(connector.id)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
