/**
 * Email Campaigns Module - Complete UI
 * Integrates all email campaign management components
 */

import React, { useState } from 'react';
import { Mail, Settings, BarChart3, Zap } from 'lucide-react';
import { EmailCampaigns } from './EmailCampaigns';
import { CampaignBuilder } from './CampaignBuilder';
import { CampaignAnalyticsComponent } from './CampaignAnalytics';
import { EmailProviders } from './EmailProviders';
import { ProviderSetup } from './ProviderSetup';
import { EmailCampaign, EmailProviderConfig } from '@/app/api/email';

interface EmailCampaignsPageProps {
  businessId: string;
}

type ViewType = 'campaigns' | 'builder' | 'analytics' | 'providers' | 'provider-setup';

export const EmailCampaignsPage: React.FC<EmailCampaignsPageProps> = ({ businessId }) => {
  const [currentView, setCurrentView] = useState<ViewType>('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | undefined>();
  const [selectedProvider, setSelectedProvider] = useState<EmailProviderConfig | undefined>();

  const handleSelectCampaign = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setCurrentView('analytics');
  };

  const handleCreateCampaign = () => {
    setSelectedCampaign(undefined);
    setCurrentView('builder');
  };

  const handleSaveCampaign = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setCurrentView('campaigns');
  };

  const handleSelectProvider = (provider: EmailProviderConfig) => {
    setSelectedProvider(provider);
    setCurrentView('provider-setup');
  };

  const handleCreateProvider = () => {
    setSelectedProvider(undefined);
    setCurrentView('provider-setup');
  };

  const handleSaveProvider = (provider: EmailProviderConfig) => {
    setSelectedProvider(undefined);
    setCurrentView('providers');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              <button
                onClick={() => setCurrentView('campaigns')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  currentView === 'campaigns'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                Campaigns
              </button>

              <button
                onClick={() => setCurrentView('providers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  currentView === 'providers'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Providers
              </button>

              {selectedCampaign && (
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                    currentView === 'analytics'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Analytics
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'campaigns' && (
          <EmailCampaigns
            businessId={businessId}
            onSelectCampaign={handleSelectCampaign}
            onCreateNew={handleCreateCampaign}
          />
        )}

        {currentView === 'builder' && (
          <CampaignBuilder
            businessId={businessId}
            campaign={selectedCampaign}
            onSave={handleSaveCampaign}
            onCancel={() => setCurrentView('campaigns')}
          />
        )}

        {currentView === 'analytics' && selectedCampaign && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setCurrentView('campaigns')}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-4"
              >
                ← Back to Campaigns
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCampaign.name} - Analytics
              </h2>
              <p className="text-gray-600 mt-1">{selectedCampaign.description}</p>
            </div>
            <CampaignAnalyticsComponent campaignId={selectedCampaign.id} />
          </div>
        )}

        {currentView === 'providers' && (
          <EmailProviders
            businessId={businessId}
            onSelectProvider={handleSelectProvider}
            onCreateNew={handleCreateProvider}
          />
        )}

        {currentView === 'provider-setup' && (
          <ProviderSetup
            businessId={businessId}
            provider={selectedProvider}
            onSave={handleSaveProvider}
            onCancel={() => setCurrentView('providers')}
          />
        )}
      </div>
    </div>
  );
};

export default EmailCampaignsPage;
