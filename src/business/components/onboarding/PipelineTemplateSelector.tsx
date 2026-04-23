import { useState } from 'react';
import { Edit2, Check } from 'lucide-react';

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  stages: string[];
}

const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'sales',
    name: 'Sales Pipeline',
    description: 'Track deals from lead to close',
    icon: '💰',
    stages: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
  },
  {
    id: 'support',
    name: 'Support Pipeline',
    description: 'Manage customer support tickets',
    icon: '🎯',
    stages: ['New', 'Assigned', 'In Progress', 'Waiting', 'Resolved', 'Closed'],
  },
  {
    id: 'order',
    name: 'Order Pipeline',
    description: 'Track orders from creation to delivery',
    icon: '📦',
    stages: ['Order Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Returned'],
  },
];

interface PipelineTemplateSelectorProps {
  selectedTemplates?: string[];
  onSelectionChange?: (templateIds: string[]) => void;
  onStagesChange?: (templateId: string, stages: string[]) => void;
}

export function PipelineTemplateSelector({
  selectedTemplates = [],
  onSelectionChange,
  onStagesChange,
}: PipelineTemplateSelectorProps) {
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editingStages, setEditingStages] = useState<Record<string, string[]>>({});
  const [newStageInput, setNewStageInput] = useState<Record<string, string>>({});

  const colors = {
    bg: '#0a0e27',
    card: '#111827',
    border: '#1f2937',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#ff4400',
    success: '#10b981',
    hover: '#1a1f3a',
  };

  const toggleTemplate = (templateId: string) => {
    const newSelection = selectedTemplates.includes(templateId)
      ? selectedTemplates.filter(id => id !== templateId)
      : [...selectedTemplates, templateId];
    onSelectionChange?.(newSelection);
  };

  const startEditing = (template: PipelineTemplate) => {
    setEditingTemplate(template.id);
    setEditingStages(prev => ({
      ...prev,
      [template.id]: editingStages[template.id] || template.stages,
    }));
  };

  const saveEdit = (templateId: string) => {
    const stages = editingStages[templateId] || [];
    onStagesChange?.(templateId, stages);
    setEditingTemplate(null);
  };

  const addStage = (templateId: string) => {
    const newStage = newStageInput[templateId]?.trim();
    if (newStage) {
      setEditingStages(prev => ({
        ...prev,
        [templateId]: [...(prev[templateId] || []), newStage],
      }));
      setNewStageInput(prev => ({ ...prev, [templateId]: '' }));
    }
  };

  const removeStage = (templateId: string, stageIndex: number) => {
    setEditingStages(prev => ({
      ...prev,
      [templateId]: prev[templateId]?.filter((_, idx) => idx !== stageIndex) || [],
    }));
  };

  const editingStagesList = editingStages[editingTemplate || ''] || [];

  return (
    <div style={{ width: '100%' }}>
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: colors.text,
          margin: '0 0 20px 0',
        }}
      >
        Select Pipeline Templates
      </h3>

      <p
        style={{
          fontSize: '13px',
          color: colors.textMuted,
          margin: '0 0 16px 0',
          lineHeight: '1.5',
        }}
      >
        Choose the pipelines you want to set up. You can customize stages for each pipeline.
      </p>

      {/* Templates Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {PIPELINE_TEMPLATES.map(template => (
          <div
            key={template.id}
            style={{
              background: colors.card,
              border: `2px solid ${
                selectedTemplates.includes(template.id) ? colors.accent : colors.border
              }`,
              borderRadius: '10px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              if (!selectedTemplates.includes(template.id)) {
                el.style.borderColor = colors.text;
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              if (!selectedTemplates.includes(template.id)) {
                el.style.borderColor = colors.border;
              }
            }}
            onClick={() => toggleTemplate(template.id)}
          >
            {/* Checkbox Indicator */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: `2px solid ${
                  selectedTemplates.includes(template.id) ? colors.accent : colors.border
                }`,
                background: selectedTemplates.includes(template.id) ? colors.accent : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transition: 'all 0.2s ease',
              }}
            >
              {selectedTemplates.includes(template.id) && <Check size={14} />}
            </div>

            {/* Icon and Name */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{template.icon}</div>
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: '0 0 4px 0',
                }}
              >
                {template.name}
              </h4>
              <p
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                {template.description}
              </p>
            </div>

            {/* Stages Preview */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '11px',
                  color: colors.textMuted,
                  marginBottom: '6px',
                  fontWeight: 500,
                }}
              >
                Stages:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(editingStages[template.id] || template.stages).slice(0, 3).map((stage, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: `${colors.accent}20`,
                      color: colors.accent,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 500,
                    }}
                  >
                    {stage}
                  </span>
                ))}
                {(editingStages[template.id] || template.stages).length > 3 && (
                  <span
                    style={{
                      color: colors.textMuted,
                      fontSize: '10px',
                      padding: '3px 8px',
                    }}
                  >
                    +{(editingStages[template.id] || template.stages).length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            {selectedTemplates.includes(template.id) && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  startEditing(template);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: `${colors.accent}20`,
                  border: `1px solid ${colors.accent}`,
                  color: colors.accent,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.target as HTMLElement;
                  el.style.background = colors.accent;
                  el.style.color = 'white';
                }}
                onMouseLeave={e => {
                  const el = e.target as HTMLElement;
                  el.style.background = `${colors.accent}20`;
                  el.style.color = colors.accent;
                }}
              >
                <Edit2 size={12} />
                Edit Stages
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTemplate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '20px',
          }}
          onClick={() => setEditingTemplate(null)}
        >
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: colors.text,
                margin: '0 0 20px 0',
              }}
            >
              Edit Stages for {PIPELINE_TEMPLATES.find(t => t.id === editingTemplate)?.name}
            </h3>

            {/* Current Stages */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  marginBottom: '8px',
                  fontWeight: 500,
              }}
              >
                Current Stages:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {editingStagesList.map((stage, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: colors.bg,
                      borderRadius: '6px',
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <span style={{ fontSize: '13px', color: colors.text }}>{stage}</span>
                    <button
                      onClick={() => removeStage(editingTemplate, idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: colors.textMuted,
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '4px 8px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Stage */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                Add Stage:
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="New stage name..."
                  value={newStageInput[editingTemplate] || ''}
                  onChange={e => setNewStageInput(prev => ({ ...prev, [editingTemplate]: e.target.value }))}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      addStage(editingTemplate);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => addStage(editingTemplate)}
                  style={{
                    padding: '8px 12px',
                    background: colors.accent,
                    border: 'none',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEditingTemplate(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.textMuted,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => saveEdit(editingTemplate)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: colors.accent,
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
