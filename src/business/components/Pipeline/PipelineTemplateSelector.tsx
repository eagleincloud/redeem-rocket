/**
 * PipelineTemplateSelector Component
 * Choose from pre-built pipeline templates or create custom
 */

import React, { useState, useCallback } from 'react';
import { CreatePipelineRequest } from '../../types/pipeline';
import './PipelineTemplateSelector.css';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  stages: Array<{
    name: string;
    color: string;
    isWinStage: boolean;
    isTerminal: boolean;
    probabilityWeight: number;
  }>;
  category: string;
}

interface PipelineTemplateSelectorProps {
  onSelect: (pipeline: CreatePipelineRequest, stages: Template['stages']) => void;
  onClose?: () => void;
}

const TEMPLATES: Template[] = [
  {
    id: 'lead-pipeline',
    name: 'Lead Pipeline',
    description: 'Classic sales funnel for lead management',
    icon: '📊',
    category: 'Sales',
    stages: [
      { name: 'Prospect', color: '#3B82F6', isWinStage: false, isTerminal: false, probabilityWeight: 0.1 },
      { name: 'Qualified', color: '#8B5CF6', isWinStage: false, isTerminal: false, probabilityWeight: 0.3 },
      { name: 'Proposal', color: '#F97316', isWinStage: false, isTerminal: false, probabilityWeight: 0.5 },
      { name: 'Negotiation', color: '#EAB308', isWinStage: false, isTerminal: false, probabilityWeight: 0.7 },
      { name: 'Won', color: '#10B981', isWinStage: true, isTerminal: true, probabilityWeight: 1.0 },
      { name: 'Lost', color: '#EF4444', isWinStage: false, isTerminal: true, probabilityWeight: 0.0 },
    ],
  },
  {
    id: 'order-pipeline',
    name: 'Order Pipeline',
    description: 'Track orders from placement through delivery',
    icon: '🛒',
    category: 'Operations',
    stages: [
      { name: 'Pending', color: '#EAB308', isWinStage: false, isTerminal: false, probabilityWeight: 0.3 },
      { name: 'Confirmed', color: '#3B82F6', isWinStage: false, isTerminal: false, probabilityWeight: 0.6 },
      { name: 'Preparing', color: '#8B5CF6', isWinStage: false, isTerminal: false, probabilityWeight: 0.75 },
      { name: 'Ready', color: '#F97316', isWinStage: false, isTerminal: false, probabilityWeight: 0.9 },
      { name: 'Completed', color: '#10B981', isWinStage: true, isTerminal: true, probabilityWeight: 1.0 },
      { name: 'Cancelled', color: '#EF4444', isWinStage: false, isTerminal: true, probabilityWeight: 0.0 },
    ],
  },
  {
    id: 'support-pipeline',
    name: 'Support Pipeline',
    description: 'Manage customer support tickets',
    icon: '🎧',
    category: 'Support',
    stages: [
      { name: 'Open', color: '#EF4444', isWinStage: false, isTerminal: false, probabilityWeight: 0.2 },
      { name: 'Assigned', color: '#F97316', isWinStage: false, isTerminal: false, probabilityWeight: 0.4 },
      { name: 'In-Progress', color: '#EAB308', isWinStage: false, isTerminal: false, probabilityWeight: 0.6 },
      { name: 'Waiting', color: '#3B82F6', isWinStage: false, isTerminal: false, probabilityWeight: 0.5 },
      { name: 'Resolved', color: '#10B981', isWinStage: true, isTerminal: true, probabilityWeight: 1.0 },
    ],
  },
];

const PipelineTemplateSelector: React.FC<PipelineTemplateSelectorProps> = ({
  onSelect,
  onClose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [step, setStep] = useState<'templates' | 'customize'>('templates');

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setCustomName(template.name);
    setCustomDescription(template.description);
    setStep('customize');
  };

  const handleCreateCustom = () => {
    setSelectedTemplate(null);
    setCustomName('');
    setCustomDescription('');
    setStep('customize');
  };

  const handleConfirm = useCallback(() => {
    if (!customName.trim()) {
      alert('Pipeline name is required');
      return;
    }

    const pipelineRequest: CreatePipelineRequest = {
      name: customName.trim(),
      description: customDescription.trim(),
      icon: selectedTemplate?.icon || '📋',
      color: selectedTemplate?.stages[0]?.color || '#3B82F6',
    };

    onSelect(
      pipelineRequest,
      selectedTemplate?.stages || []
    );
  }, [customName, customDescription, selectedTemplate, onSelect]);

  const groupedTemplates = TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div className="template-selector">
      <div className="selector-header">
        <h1>
          {step === 'templates' ? 'Select Pipeline Template' : 'Customize Pipeline'}
        </h1>
        {onClose && (
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}
      </div>

      {step === 'templates' && (
        <div className="templates-view">
          <div className="templates-grid">
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category} className="template-category">
                <h2 className="category-title">{category}</h2>
                <div className="templates-list">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="template-card"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="template-icon">{template.icon}</div>
                      <h3>{template.name}</h3>
                      <p>{template.description}</p>
                      <div className="stage-preview">
                        {template.stages.slice(0, 3).map((stage, idx) => (
                          <div
                            key={idx}
                            className="stage-dot"
                            style={{ backgroundColor: stage.color }}
                            title={stage.name}
                          ></div>
                        ))}
                        {template.stages.length > 3 && (
                          <div className="stage-dot-more">
                            +{template.stages.length - 3}
                          </div>
                        )}
                      </div>
                      <button className="btn-use">Use Template</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="custom-section">
            <h2>Or create a custom pipeline</h2>
            <button className="btn-custom" onClick={handleCreateCustom}>
              + Create from Scratch
            </button>
          </div>
        </div>
      )}

      {step === 'customize' && (
        <div className="customize-view">
          <div className="customize-form">
            <div className="form-group">
              <label htmlFor="pipeline-name">Pipeline Name*</label>
              <input
                id="pipeline-name"
                type="text"
                placeholder="e.g., My Sales Pipeline"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pipeline-desc">Description</label>
              <textarea
                id="pipeline-desc"
                placeholder="Brief description of this pipeline"
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
                rows={3}
              ></textarea>
            </div>

            {selectedTemplate && (
              <div className="template-info">
                <h3>Stages ({selectedTemplate.stages.length})</h3>
                <div className="stages-preview">
                  {selectedTemplate.stages.map((stage, idx) => (
                    <div key={idx} className="stage-item">
                      <div
                        className="stage-color"
                        style={{ backgroundColor: stage.color }}
                      ></div>
                      <span className="stage-name">{stage.name}</span>
                      {stage.isWinStage && <span className="badge-win">WIN</span>}
                      {stage.isTerminal && <span className="badge-final">FINAL</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              className="btn-secondary"
              onClick={() => setStep('templates')}
            >
              Back
            </button>
            <button
              className="btn-primary"
              onClick={handleConfirm}
              disabled={!customName.trim()}
            >
              Create Pipeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineTemplateSelector;
