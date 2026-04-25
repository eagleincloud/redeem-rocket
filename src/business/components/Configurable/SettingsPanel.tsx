/**
 * Settings Panel Component
 * Layer 4 - Master settings interface
 * Unified configuration for custom fields, pipelines, and permissions
 */

import React, { useState } from 'react';
import CustomFieldBuilder from './CustomFieldBuilder';
import PipelineStageEditor from './PipelineStageEditor';
import PermissionManager from './PermissionManager';
import { PipelineStageConfig } from '@/app/api/configurable-system';

interface SettingsPanelProps {
  businessId: string;
  pipelineId?: string;
  userId: string;
  onClose?: () => void;
}

type TabType = 'fields' | 'pipeline' | 'permissions';

const SettingsPanel = React.memo<SettingsPanelProps>(function SettingsPanel({
  businessId,
  pipelineId,
  userId,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState<TabType>('fields');
  const [pipelineStages, setPipelineStages] = useState<PipelineStageConfig[]>([]);

  const tabs = [
    { id: 'fields', label: 'Custom Fields', icon: '⚙️' },
    { id: 'pipeline', label: 'Pipeline Stages', icon: '🔗', disabled: !pipelineId },
    { id: 'permissions', label: 'Permissions', icon: '🔐' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-0 border-b border-gray-200 bg-gray-50 px-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              if (!tab.disabled) {
                setActiveTab(tab.id as TabType);
              }
            }}
            disabled={tab.disabled}
            className={`px-4 py-4 font-medium border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {activeTab === 'fields' && (
          <div className="p-6">
            <CustomFieldBuilder
              businessId={businessId}
              userId={userId}
              onCancel={onClose}
            />
          </div>
        )}

        {activeTab === 'pipeline' && pipelineId && (
          <div className="p-6">
            <PipelineStageEditor
              businessId={businessId}
              pipelineId={pipelineId}
              stages={pipelineStages}
              onCancel={onClose}
            />
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="p-6">
            <PermissionManager
              businessId={businessId}
              userId={userId}
              onCancel={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default SettingsPanel;
