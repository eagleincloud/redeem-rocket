import { useState } from 'react';
import { ChevronUp, ChevronDown, X, Upload, RotateCcw, Check, Eye, EyeOff } from 'lucide-react';

interface DashboardCustomizations {
  businessName: string;
  pipelineStages: string[];
  visibleWidgets: string[];
  sidebarFeatures: string[];
  colorTheme: {
    primary: string;
    secondary: string;
  };
  logoUrl: string;
}

interface PreviewCustomizationsProps {
  customizations: DashboardCustomizations;
  onSave: (customizations: DashboardCustomizations) => void;
  onCancel: () => void;
}

const AVAILABLE_WIDGETS = [
  { id: 'revenue', icon: '💰', label: 'Revenue' },
  { id: 'deals', icon: '📊', label: 'Active Deals' },
  { id: 'leads', icon: '👥', label: 'New Leads' },
  { id: 'emails', icon: '📧', label: 'Emails Sent' },
  { id: 'customers', icon: '🤝', label: 'Customers' },
  { id: 'inventory', icon: '📦', label: 'Inventory' },
  { id: 'projects', icon: '🎯', label: 'Projects' },
];

const ALL_FEATURES = [
  'product_catalog',
  'lead_management',
  'email_campaigns',
  'automation',
  'social_media',
];

export function PreviewCustomizations({
  customizations,
  onSave,
  onCancel,
}: PreviewCustomizationsProps) {
  const [state, setState] = useState<DashboardCustomizations>(customizations);
  const [newStage, setNewStage] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>(customizations.logoUrl);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    business: true,
    pipeline: true,
    widgets: true,
    features: true,
    colors: false,
    logo: false,
  });

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleBusinessNameChange = (name: string) => {
    setState(prev => ({ ...prev, businessName: name }));
  };

  const handleAddPipelineStage = () => {
    if (newStage.trim() && state.pipelineStages.length < 10) {
      setState(prev => ({
        ...prev,
        pipelineStages: [...prev.pipelineStages, newStage.trim()],
      }));
      setNewStage('');
    }
  };

  const handleRemovePipelineStage = (index: number) => {
    setState(prev => ({
      ...prev,
      pipelineStages: prev.pipelineStages.filter((_, i) => i !== index),
    }));
  };

  const handleMovePipelineStage = (index: number, direction: 'up' | 'down') => {
    const newStages = [...state.pipelineStages];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newStages.length) {
      [newStages[index], newStages[newIndex]] = [newStages[newIndex], newStages[index]];
      setState(prev => ({ ...prev, pipelineStages: newStages }));
    }
  };

  const toggleWidget = (widgetId: string) => {
    setState(prev => ({
      ...prev,
      visibleWidgets: prev.visibleWidgets.includes(widgetId)
        ? prev.visibleWidgets.filter(id => id !== widgetId)
        : [...prev.visibleWidgets, widgetId],
    }));
  };

  const toggleFeature = (featureId: string) => {
    setState(prev => ({
      ...prev,
      sidebarFeatures: prev.sidebarFeatures.includes(featureId)
        ? prev.sidebarFeatures.filter(id => id !== featureId)
        : [...prev.sidebarFeatures, featureId],
    }));
  };

  const handleColorChange = (type: 'primary' | 'secondary', value: string) => {
    setState(prev => ({
      ...prev,
      colorTheme: { ...prev.colorTheme, [type]: value },
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        setState(prev => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setState(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleReset = () => {
    setState(customizations);
    setLogoPreview(customizations.logoUrl);
  };

  const Section = ({
    title,
    sectionKey,
    children,
  }: {
    title: string;
    sectionKey: string;
    children: React.ReactNode;
  }) => (
    <div style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: '12px' }}>
      <button
        onClick={() => toggleSection(sectionKey)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          background: 'transparent',
          border: 'none',
          color: colors.text,
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={e => {
          (e.target as HTMLElement).style.color = colors.accent;
        }}
        onMouseLeave={e => {
          (e.target as HTMLElement).style.color = colors.text;
        }}
      >
        {title}
        <ChevronDown
          size={16}
          style={{
            transform: expandedSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>
      {expandedSections[sectionKey] && (
        <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '20px',
        maxHeight: '85vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: colors.text,
            margin: 0,
          }}
        >
          Dashboard Settings
        </h2>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: 'none',
            color: colors.textMuted,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.color = colors.accent;
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.color = colors.textMuted;
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Business Name Section */}
      <Section title="Business Name" sectionKey="business">
        <input
          type="text"
          value={state.businessName}
          onChange={e => handleBusinessNameChange(e.target.value)}
          maxLength={50}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: colors.hover,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            color: colors.text,
            fontSize: '14px',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={e => {
            e.target.style.borderColor = colors.accent;
          }}
          onBlur={e => {
            e.target.style.borderColor = colors.border;
          }}
          placeholder="Enter business name"
        />
        <div style={{ fontSize: '12px', color: colors.textMuted }}>
          {state.businessName.length}/50 characters
        </div>
      </Section>

      {/* Pipeline Stages Section */}
      <Section title="Pipeline Stages" sectionKey="pipeline">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {state.pipelineStages.map((stage, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                background: colors.hover,
                borderRadius: '6px',
                border: `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  minWidth: '20px',
                }}
              >
                {idx + 1}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: '13px',
                  color: colors.text,
                  padding: '4px 8px',
                }}
              >
                {stage}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleMovePipelineStage(idx, 'up')}
                  disabled={idx === 0}
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: idx === 0 ? colors.textMuted : colors.text,
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    opacity: idx === 0 ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => handleMovePipelineStage(idx, 'down')}
                  disabled={idx === state.pipelineStages.length - 1}
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: idx === state.pipelineStages.length - 1 ? colors.textMuted : colors.text,
                    cursor: idx === state.pipelineStages.length - 1 ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    opacity: idx === state.pipelineStages.length - 1 ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => handleRemovePipelineStage(idx)}
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.textMuted,
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLElement).style.color = colors.accent;
                    (e.target as HTMLElement).style.borderColor = colors.accent;
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.color = colors.textMuted;
                    (e.target as HTMLElement).style.borderColor = colors.border;
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}

          {state.pipelineStages.length < 10 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newStage}
                onChange={e => setNewStage(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleAddPipelineStage();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: colors.hover,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '13px',
                  fontFamily: 'inherit',
                }}
                placeholder="New stage name"
              />
              <button
                onClick={handleAddPipelineStage}
                style={{
                  padding: '8px 16px',
                  background: colors.accent,
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.opacity = '0.9';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.opacity = '1';
                }}
              >
                Add
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* Dashboard Widgets Section */}
      <Section title="Dashboard Widgets" sectionKey="widgets">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {AVAILABLE_WIDGETS.map(widget => (
            <button
              key={widget.id}
              onClick={() => toggleWidget(widget.id)}
              style={{
                padding: '10px 12px',
                background: state.visibleWidgets.includes(widget.id) ? colors.accent : colors.hover,
                border: `1px solid ${
                  state.visibleWidgets.includes(widget.id) ? colors.accent : colors.border
                }`,
                color: 'white',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                const el = e.target as HTMLElement;
                if (!state.visibleWidgets.includes(widget.id)) {
                  el.style.borderColor = colors.accent;
                }
              }}
              onMouseLeave={e => {
                const el = e.target as HTMLElement;
                if (!state.visibleWidgets.includes(widget.id)) {
                  el.style.borderColor = colors.border;
                }
              }}
            >
              {state.visibleWidgets.includes(widget.id) && <Check size={14} />}
              <span>{widget.icon}</span>
              <span style={{ fontSize: '12px' }}>{widget.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Enabled Features Section */}
      <Section title="Enabled Features" sectionKey="features">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ALL_FEATURES.map(feature => (
            <button
              key={feature}
              onClick={() => toggleFeature(feature)}
              style={{
                padding: '10px 12px',
                background: state.sidebarFeatures.includes(feature) ? colors.accent : colors.hover,
                border: `1px solid ${
                  state.sidebarFeatures.includes(feature) ? colors.accent : colors.border
                }`,
                color: 'white',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                const el = e.target as HTMLElement;
                if (!state.sidebarFeatures.includes(feature)) {
                  el.style.borderColor = colors.accent;
                }
              }}
              onMouseLeave={e => {
                const el = e.target as HTMLElement;
                if (!state.sidebarFeatures.includes(feature)) {
                  el.style.borderColor = colors.border;
                }
              }}
            >
              <span>{feature.replace(/_/g, ' ')}</span>
              {state.sidebarFeatures.includes(feature) ? (
                <Eye size={14} />
              ) : (
                <EyeOff size={14} />
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* Theme Colors Section */}
      <Section title="Theme Colors" sectionKey="colors">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: colors.textMuted,
                marginBottom: '6px',
                fontWeight: 500,
              }}
            >
              Primary Color
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={state.colorTheme.primary}
                onChange={e => handleColorChange('primary', e.target.value)}
                style={{
                  width: '50px',
                  height: '40px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                }}
              />
              <input
                type="text"
                value={state.colorTheme.primary}
                onChange={e => handleColorChange('primary', e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: colors.hover,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: colors.textMuted,
                marginBottom: '6px',
                fontWeight: 500,
              }}
            >
              Secondary Color
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={state.colorTheme.secondary}
                onChange={e => handleColorChange('secondary', e.target.value)}
                style={{
                  width: '50px',
                  height: '40px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                }}
              />
              <input
                type="text"
                value={state.colorTheme.secondary}
                onChange={e => handleColorChange('secondary', e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: colors.hover,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Logo Section */}
      <Section title="Business Logo" sectionKey="logo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logoPreview && (
            <div style={{ textAlign: 'center' }}>
              <img
                src={logoPreview}
                alt="Logo preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  marginBottom: '8px',
                }}
              />
              <button
                onClick={handleRemoveLogo}
                style={{
                  padding: '6px 12px',
                  background: colors.accent,
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Remove Logo
              </button>
            </div>
          )}

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: colors.hover,
              border: `2px dashed ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.background = colors.hover;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.background = colors.hover;
            }}
          >
            <Upload size={16} style={{ color: colors.accent }} />
            <span style={{ fontSize: '13px', color: colors.text }}>Upload Logo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </Section>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
        <button
          onClick={handleReset}
          style={{
            flex: 1,
            padding: '12px',
            background: 'transparent',
            border: `1.5px solid ${colors.border}`,
            color: colors.textMuted,
            borderRadius: '8px',
            fontSize: '13px',
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
            el.style.borderColor = colors.text;
            el.style.color = colors.text;
          }}
          onMouseLeave={e => {
            const el = e.target as HTMLElement;
            el.style.borderColor = colors.border;
            el.style.color = colors.textMuted;
          }}
        >
          <RotateCcw size={14} />
          Reset
        </button>
        <button
          onClick={() => onSave(state)}
          style={{
            flex: 1,
            padding: '12px',
            background: colors.accent,
            border: 'none',
            color: 'white',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.opacity = '0.9';
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.opacity = '1';
          }}
        >
          <Check size={14} />
          Save Changes
        </button>
      </div>
    </div>
  );
}
