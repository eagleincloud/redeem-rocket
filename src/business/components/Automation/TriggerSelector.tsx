/**
 * TriggerSelector Component
 * Select and configure automation triggers with trigger-specific config options
 */

import React, { useCallback, useMemo } from 'react';
import {
  Plus,
  Mail,
  Link2,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-react';
import type { TriggerType } from '../../types/automation';
import './TriggerSelector.css';

interface TriggerSelectorProps {
  selectedTrigger: TriggerType | '';
  onTriggerChange: (trigger: TriggerType) => void;
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
}

interface TriggerCardData {
  value: TriggerType;
  label: string;
  description: string;
  example: string;
  icon: React.ReactNode;
}

const TRIGGER_CARDS: TriggerCardData[] = [
  {
    value: 'lead_added',
    label: 'Lead Added',
    description: 'Trigger when a new lead is created in the system',
    example: 'Send welcome email to new leads',
    icon: <Plus size={24} />,
  },
  {
    value: 'email_opened',
    label: 'Email Opened',
    description: 'Trigger when a recipient opens a sent email',
    example: 'Follow up after email is opened',
    icon: <Mail size={24} />,
  },
  {
    value: 'email_clicked',
    label: 'Email Clicked',
    description: 'Trigger when a recipient clicks a link in an email',
    example: 'Create task when link is clicked',
    icon: <Link2 size={24} />,
  },
  {
    value: 'stage_changed',
    label: 'Stage Changed',
    description: 'Trigger when a lead moves to a different pipeline stage',
    example: 'Notify manager when lead qualifies',
    icon: <TrendingUp size={24} />,
  },
  {
    value: 'inactivity',
    label: 'Inactivity',
    description: 'Trigger when a lead has not had activity for X days',
    example: 'Re-engage inactive leads after 30 days',
    icon: <Clock size={24} />,
  },
  {
    value: 'milestone_reached',
    label: 'Milestone Reached',
    description: 'Trigger when a custom milestone event occurs',
    example: 'Celebrate when deal value reaches target',
    icon: <Zap size={24} />,
  },
];

const TriggerSelector: React.FC<TriggerSelectorProps> = ({
  selectedTrigger,
  onTriggerChange,
  config,
  onConfigChange,
}) => {
  const selectedCard = useMemo(
    () => TRIGGER_CARDS.find((card) => card.value === selectedTrigger),
    [selectedTrigger]
  );

  // Handle trigger selection
  const handleTriggerSelect = useCallback(
    (trigger: TriggerType) => {
      onTriggerChange(trigger);
      onConfigChange({}); // Reset config when changing trigger
    },
    [onTriggerChange, onConfigChange]
  );

  // Handle inactivity days change
  const handleInactivityDaysChange = useCallback(
    (days: number) => {
      onConfigChange({ ...config, min_days: days });
    },
    [config, onConfigChange]
  );

  // Handle stage selection for stage_changed trigger
  const handleStageChange = useCallback(
    (stageId: string) => {
      onConfigChange({ ...config, to_stage_id: stageId });
    },
    [config, onConfigChange]
  );

  // Handle email template selection
  const handleEmailTemplateChange = useCallback(
    (templateId: string) => {
      onConfigChange({ ...config, template_id: templateId });
    },
    [config, onConfigChange]
  );

  // Handle track all emails toggle
  const handleTrackAllToggle = useCallback(() => {
    onConfigChange({ ...config, track_all: !config.track_all });
  }, [config, onConfigChange]);

  // Handle milestone event name
  const handleMilestoneEventChange = useCallback(
    (eventName: string) => {
      onConfigChange({ ...config, event_name: eventName });
    },
    [config, onConfigChange]
  );

  return (
    <div className="trigger-selector-container">
      {/* Trigger Cards Grid */}
      <div className="trigger-cards-grid">
        {TRIGGER_CARDS.map((card) => (
          <div
            key={card.value}
            className={`trigger-card ${selectedTrigger === card.value ? 'selected' : ''}`}
            onClick={() => handleTriggerSelect(card.value)}
          >
            <div className="card-icon">{card.icon}</div>
            <h4 className="card-title">{card.label}</h4>
            <p className="card-description">{card.description}</p>
            <p className="card-example">
              <strong>Example:</strong> {card.example}
            </p>
          </div>
        ))}
      </div>

      {/* Trigger-Specific Configuration */}
      {selectedTrigger && selectedCard && (
        <div className="trigger-config-section">
          <h4>Configure {selectedCard.label}</h4>

          {/* Inactivity Trigger Config */}
          {selectedTrigger === 'inactivity' && (
            <div className="config-group">
              <label htmlFor="inactivity-days">Days of Inactivity *</label>
              <div className="input-group">
                <input
                  id="inactivity-days"
                  type="number"
                  min="1"
                  max="365"
                  value={config.min_days || ''}
                  onChange={(e) => handleInactivityDaysChange(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 30"
                />
                <span className="input-addon">days</span>
              </div>
              <small>Number of days of inactivity to trigger this rule</small>
            </div>
          )}

          {/* Stage Changed Trigger Config */}
          {selectedTrigger === 'stage_changed' && (
            <div className="config-group">
              <label htmlFor="target-stage">Target Stage *</label>
              <select
                id="target-stage"
                value={config.to_stage_id || ''}
                onChange={(e) => handleStageChange(e.target.value)}
              >
                <option value="">Select a stage...</option>
                <option value="stage_1">Lead - New</option>
                <option value="stage_2">Lead - Qualified</option>
                <option value="stage_3">Opportunity - In Progress</option>
                <option value="stage_4">Deal - Won</option>
                <option value="stage_5">Customer - Active</option>
              </select>
              <small>Trigger when lead moves to this stage</small>
            </div>
          )}

          {/* Email Opened Trigger Config */}
          {selectedTrigger === 'email_opened' && (
            <>
              <div className="config-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.track_all || false}
                    onChange={handleTrackAllToggle}
                  />
                  <span>Track all emails (if unchecked, select specific template)</span>
                </label>
              </div>

              {!config.track_all && (
                <div className="config-group">
                  <label htmlFor="email-template">Email Template</label>
                  <select
                    id="email-template"
                    value={config.template_id || ''}
                    onChange={(e) => handleEmailTemplateChange(e.target.value)}
                  >
                    <option value="">All templates</option>
                    <option value="welcome">Welcome Email</option>
                    <option value="followup">Follow-up Email</option>
                    <option value="nurture">Nurture Campaign</option>
                    <option value="promotional">Promotional Email</option>
                  </select>
                  <small>Optional: Trigger only for specific email template</small>
                </div>
              )}
            </>
          )}

          {/* Email Clicked Trigger Config */}
          {selectedTrigger === 'email_clicked' && (
            <>
              <div className="config-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.track_all || false}
                    onChange={handleTrackAllToggle}
                  />
                  <span>Track all clicks (if unchecked, select specific template)</span>
                </label>
              </div>

              {!config.track_all && (
                <div className="config-group">
                  <label htmlFor="email-template-clicked">Email Template</label>
                  <select
                    id="email-template-clicked"
                    value={config.template_id || ''}
                    onChange={(e) => handleEmailTemplateChange(e.target.value)}
                  >
                    <option value="">All templates</option>
                    <option value="welcome">Welcome Email</option>
                    <option value="followup">Follow-up Email</option>
                    <option value="nurture">Nurture Campaign</option>
                    <option value="promotional">Promotional Email</option>
                  </select>
                  <small>Optional: Trigger only for specific email template</small>
                </div>
              )}

              <div className="config-group">
                <label htmlFor="link-url">Specific Link (Optional)</label>
                <input
                  id="link-url"
                  type="text"
                  placeholder="https://example.com/specific-link (leave empty to track any click)"
                  value={config.link || ''}
                  onChange={(e) =>
                    onConfigChange({ ...config, link: e.target.value })
                  }
                />
                <small>Leave empty to trigger on any link click</small>
              </div>
            </>
          )}

          {/* Milestone Reached Trigger Config */}
          {selectedTrigger === 'milestone_reached' && (
            <>
              <div className="config-group">
                <label htmlFor="milestone-event">Event Name *</label>
                <input
                  id="milestone-event"
                  type="text"
                  placeholder="e.g., deal_won, revenue_target_met"
                  value={config.event_name || ''}
                  onChange={(e) => handleMilestoneEventChange(e.target.value)}
                />
                <small>Custom event name to trigger on</small>
              </div>

              <div className="config-group">
                <label htmlFor="milestone-value">Milestone Value (Optional)</label>
                <input
                  id="milestone-value"
                  type="number"
                  placeholder="e.g., 10000"
                  value={config.milestone_value || ''}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      milestone_value: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
                <small>Numeric value to reach for milestone (optional)</small>
              </div>
            </>
          )}

          {/* Lead Added Trigger (no additional config needed) */}
          {selectedTrigger === 'lead_added' && (
            <div className="config-info">
              <p>This trigger activates whenever a new lead is created.</p>
              <p>No additional configuration is needed.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

