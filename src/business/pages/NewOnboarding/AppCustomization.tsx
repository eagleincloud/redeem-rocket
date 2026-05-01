import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { saveAppData, getAppData } from '@/business/utils/onboarding/appState';
import {
  categoryData, getPresetsForCategory, getPresetById,
  fontStyleInfo, layoutStyleInfo, StylePreset,
} from '@/business/utils/onboarding/categoryStyles';
import {
  Upload, Check, Palette, Type, Layout, Sparkles, Eye,
  ChevronRight, Moon, Sun, Sliders,
} from 'lucide-react';

const colorSwatches = [
  '#1565C0', '#7B1FA2', '#C62828', '#E65100', '#2E7D32',
  '#00695C', '#006064', '#4527A0', '#AD1457', '#263238',
  '#C8A951', '#FF4F7B', '#00BFA5', '#00E676', '#FF6B35',
];

function PhonePreview({ preset, appName, category }: { preset: StylePreset; appName: string; category: string }) {
  const catInfo = categoryData[category] ?? categoryData['Other'];
  const displayName = appName || `My ${category || 'Business'} App`;

  // Category-specific preview data
  const previewContent: Record<string, { items: { label: string; sub: string; emoji: string }[]; heroText: string; heroSub: string }> = {
    Restaurant: {
      heroText: "Today's Specials",
      heroSub: '3 new dishes added',
      items: [
        { label: 'Butter Chicken', sub: '₹280 • 25 min', emoji: '🍛' },
        { label: 'Paneer Tikka', sub: '₹220 • 20 min', emoji: '🔥' },
        { label: 'Dal Makhani', sub: '₹180 • 20 min', emoji: '🫕' },
      ],
    },
    'Salon & Spa': {
      heroText: 'Book a Session',
      heroSub: 'Available today',
      items: [
        { label: 'Hair Color', sub: '90 min • ₹1,200', emoji: '💇' },
        { label: 'Facial', sub: '60 min • ₹800', emoji: '✨' },
        { label: 'Massage', sub: '45 min • ₹600', emoji: '💆' },
      ],
    },
    'Fitness & Gym': {
      heroText: "Today's Workout",
      heroSub: 'Power & Strength',
      items: [
        { label: 'Morning HIIT', sub: '6:00 AM • 45 min', emoji: '🏋️' },
        { label: 'Yoga Flow', sub: '7:30 AM • 60 min', emoji: '🧘' },
        { label: 'Spin Class', sub: '9:00 AM • 45 min', emoji: '🚴' },
      ],
    },
    Healthcare: {
      heroText: 'Book Appointment',
      heroSub: 'Next slot: Today 3pm',
      items: [
        { label: 'Dr. R. Sharma', sub: 'General • Available', emoji: '👨‍⚕️' },
        { label: 'Dr. P. Mehta', sub: 'Dental • Tomorrow', emoji: '🦷' },
        { label: 'Lab Tests', sub: 'Home collection', emoji: '🧪' },
      ],
    },
    'Real Estate': {
      heroText: 'Explore Properties',
      heroSub: '42 new listings',
      items: [
        { label: '3BHK Apartment', sub: 'Bandra • ₹2.4 Cr', emoji: '🏢' },
        { label: 'Villa Plot', sub: 'Juhu • ₹5.1 Cr', emoji: '🏡' },
        { label: 'Office Space', sub: 'BKC • ₹85k/mo', emoji: '🏗️' },
      ],
    },
    Education: {
      heroText: 'Continue Learning',
      heroSub: '3 courses in progress',
      items: [
        { label: 'React Mastery', sub: '62% complete', emoji: '⚛️' },
        { label: 'Data Science', sub: '38% complete', emoji: '📊' },
        { label: 'UI/UX Design', sub: '85% complete', emoji: '🎨' },
      ],
    },
    Retail: {
      heroText: 'New Arrivals',
      heroSub: '20% off this week',
      items: [
        { label: 'Summer Collection', sub: '12 items • New', emoji: '👗' },
        { label: 'Accessories', sub: '25 items', emoji: '👜' },
        { label: 'Sale Items', sub: 'Up to 50% off', emoji: '🏷️' },
      ],
    },
    'E-commerce': {
      heroText: 'Flash Sale! 🔥',
      heroSub: 'Ends in 4h 22m',
      items: [
        { label: 'Wireless Earbuds', sub: '₹1,299 • ⭐4.8', emoji: '🎧' },
        { label: 'Smart Watch', sub: '₹2,999 • ⭐4.6', emoji: '⌚' },
        { label: 'Phone Stand', sub: '₹299 • ⭐4.9', emoji: '📱' },
      ],
    },
  };

  const content = previewContent[category] ?? {
    heroText: 'Welcome Back!',
    heroSub: 'Explore our services',
    items: [
      { label: 'Our Services', sub: 'View all options', emoji: '⚡' },
      { label: 'Special Offers', sub: 'Limited time deals', emoji: '🎁' },
      { label: 'Get in Touch', sub: "We're here to help", emoji: '💬' },
    ],
  };

  const isLight = preset.theme === 'light';
  const btnRadius = preset.buttonStyle === 'pill' ? '9999px' : preset.buttonStyle === 'square' ? '6px' : '10px';

  return (
    <div className="mx-auto relative" style={{ width: '260px' }}>
      {/* Phone shell */}
      <div
        className="rounded-[2.5rem] overflow-hidden shadow-2xl border-[10px]"
        style={{ borderColor: isLight ? '#1C1C2E' : '#333', backgroundColor: preset.bg }}
      >
        {/* Notch */}
        <div style={{ height: '22px', backgroundColor: isLight ? '#1C1C2E' : '#333', position: 'relative' }}>
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '80px', height: '18px', backgroundColor: isLight ? '#1C1C2E' : '#333',
            borderRadius: '0 0 16px 16px',
          }} />
        </div>

        {/* Screen */}
        <div style={{ height: '480px', backgroundColor: preset.bg, overflow: 'hidden', position: 'relative' }}>
          {/* Status bar */}
          <div className="flex justify-between items-center px-4 py-1.5" style={{ backgroundColor: preset.bg }}>
            <span style={{ fontSize: '10px', color: preset.textSecondary }}>9:41</span>
            <div className="flex gap-0.5" style={{ fontSize: '10px' }}>
              <span style={{ color: preset.textSecondary }}>●●●</span>
            </div>
          </div>

          {/* App Header */}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: preset.surface }}>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${preset.primary}, ${preset.accent})`,
                }}
              >
                <span style={{ fontSize: '12px' }}>{catInfo.emoji}</span>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: preset.textPrimary, lineHeight: 1.1 }}>
                  {displayName.length > 16 ? displayName.slice(0, 14) + '…' : displayName}
                </div>
                <div style={{ fontSize: '8px', color: preset.textSecondary }}>Business App</div>
              </div>
            </div>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: preset.primary + '20' }}
            >
              <span style={{ fontSize: '10px' }}>🔔</span>
            </div>
          </div>

          {/* Hero Section */}
          <div
            className="mx-3 mt-2 rounded-xl p-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${preset.primary}, ${preset.accent})`,
              minHeight: '80px',
            }}
          >
            <div
              style={{
                position: 'absolute', right: '-10px', bottom: '-10px',
                width: '70px', height: '70px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            />
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
              {content.heroText}
            </div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
              {content.heroSub}
            </div>
            <div
              style={{
                fontSize: '9px', fontWeight: 600, color: preset.primary,
                backgroundColor: '#FFFFFF', borderRadius: btnRadius,
                padding: '4px 10px', display: 'inline-block',
              }}
            >
              View All →
            </div>
          </div>

          {/* Content Items */}
          <div className="px-3 mt-3 space-y-1.5">
            <div style={{ fontSize: '9px', fontWeight: 700, color: preset.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {category === 'Restaurant' ? 'Menu Items' : category === 'Fitness & Gym' ? 'Classes Today' : 'Featured'}
            </div>
            {content.items.slice(0, 3).map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl p-2"
                style={{ backgroundColor: preset.surface }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: preset.primary + '15' }}
                >
                  <span style={{ fontSize: '12px' }}>{item.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: '9px', fontWeight: 600, color: preset.textPrimary }}>{item.label}</div>
                  <div style={{ fontSize: '8px', color: preset.textSecondary }}>{item.sub}</div>
                </div>
                <div
                  style={{
                    fontSize: '8px', fontWeight: 600, color: '#FFFFFF',
                    backgroundColor: preset.primary, borderRadius: btnRadius,
                    padding: '3px 7px', flexShrink: 0,
                  }}
                >
                  →
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Nav */}
          <div
            className="absolute bottom-0 left-0 right-0 flex justify-around items-center px-4 py-2"
            style={{ backgroundColor: preset.surface, borderTop: `1px solid ${preset.primary}20` }}
          >
            {['🏠', '🔍', '🛒', '👤'].map((icon, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span style={{ fontSize: '12px', opacity: i === 0 ? 1 : 0.4 }}>{icon}</span>
                {i === 0 && (
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: preset.primary }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reflection */}
      <div className="absolute -bottom-4 left-4 right-4 h-8 blur-xl opacity-30 rounded-full"
        style={{ background: `linear-gradient(to right, ${preset.primary}, ${preset.accent})` }} />
    </div>
  );
}

export default function AppCustomization() {
  const navigate = useNavigate();
  const [appName, setAppName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [accentColor, setAccentColor] = useState('#8B5CF6');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fontStyle, setFontStyle] = useState('modern');
  const [layoutStyle, setLayoutStyle] = useState('card');
  const [buttonStyle, setButtonStyle] = useState<'rounded' | 'pill' | 'square'>('rounded');
  const [activeSection, setActiveSection] = useState<'preset' | 'customize'>('preset');

  const [livePreset, setLivePreset] = useState<StylePreset>({
    id: 'default',
    name: 'Default',
    tagline: '',
    primary: '#3B82F6',
    accent: '#8B5CF6',
    bg: '#FFFFFF',
    surface: '#F8FAFC',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    theme: 'light',
    font: 'modern',
    layout: 'card',
    buttonStyle: 'rounded',
    mood: '',
    gradFrom: '#3B82F6',
    gradTo: '#8B5CF6',
  });

  useEffect(() => {
    const data = getAppData();
    const cat = data.category || 'Other';
    setCategory(cat);
    setAppName(data.appName || data.businessName || '');

    const presets = getPresetsForCategory(cat);
    const firstPreset = presets[0];
    setSelectedPresetId(data.stylePresetId || firstPreset.id);
    applyPresetValues(data.stylePresetId ? getPresetById(cat, data.stylePresetId) ?? firstPreset : firstPreset);
  }, []);

  const applyPresetValues = (preset: StylePreset) => {
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
    setTheme(preset.theme);
    setFontStyle(preset.font);
    setLayoutStyle(preset.layout);
    setButtonStyle(preset.buttonStyle);
    setLivePreset({ ...preset });
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = getPresetById(category, presetId);
    if (preset) applyPresetValues(preset);
  };

  // Update live preview when manual controls change
  useEffect(() => {
    setLivePreset(prev => ({
      ...prev,
      primary: primaryColor,
      accent: accentColor,
      theme,
      bg: theme === 'dark' ? '#0A0A0A' : '#FFFFFF',
      surface: theme === 'dark' ? '#1A1A1A' : '#F8FAFC',
      textPrimary: theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
      textSecondary: theme === 'dark' ? '#9CA3AF' : '#6B7280',
      font: fontStyle as any,
      layout: layoutStyle as any,
      buttonStyle,
    }));
  }, [primaryColor, accentColor, theme, fontStyle, layoutStyle, buttonStyle]);

  const handleContinue = () => {
    saveAppData({
      appName,
      stylePresetId: selectedPresetId,
      primaryColor,
      accentColor,
      bgColor: livePreset.bg,
      theme,
      fontStyle,
      layoutStyle,
      buttonStyle,
    });
    navigate('/preview');
  };

  const presets = getPresetsForCategory(category);
  const catInfo = categoryData[category] ?? categoryData['Other'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Category Banner */}
        <div
          className="rounded-2xl p-5 mb-6 text-white overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${catInfo.gradFrom}, ${catInfo.gradTo})` }}
        >
          <div style={{
            position: 'absolute', right: '-20px', top: '-20px',
            width: '120px', height: '120px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-1">
              <span style={{ fontSize: '2rem' }}>{catInfo.emoji}</span>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: '#FFFFFF' }}>
                  Design your {category} App
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
                  {presets.length} curated style presets crafted for {category} businesses
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Customization */}
          <div className="lg:col-span-3 space-y-5">

            {/* Section Toggle */}
            <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100 flex">
              {(['preset', 'customize'] as const).map(sec => (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${
                    activeSection === sec ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={{ fontWeight: activeSection === sec ? 600 : 400 }}
                >
                  {sec === 'preset' ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Style Presets
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Sliders className="w-4 h-4" /> Custom Tweaks
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Preset Cards */}
            {activeSection === 'preset' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-gray-900 mb-4" style={{ fontWeight: 600 }}>
                  Choose a Style Preset
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {presets.map(preset => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`relative rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                        }`}
                        style={{ borderColor: isSelected ? preset.primary : '#E5E7EB' }}
                      >
                        {/* Color Swatch */}
                        <div
                          className="h-20 w-full relative overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${preset.gradFrom}, ${preset.gradTo})` }}
                        >
                          {/* Mini UI dots */}
                          <div style={{ position: 'absolute', top: 8, left: 10, display: 'flex', gap: '4px' }}>
                            {[preset.primary, preset.accent, '#FFFFFF'].map((c, i) => (
                              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c, opacity: 0.9, border: '1px solid rgba(255,255,255,0.3)' }} />
                            ))}
                          </div>
                          {/* Mock bars */}
                          <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10 }}>
                            <div style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)', marginBottom: 4, width: '70%' }} />
                            <div style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', width: '45%' }} />
                          </div>
                          {isSelected && (
                            <div style={{
                              position: 'absolute', top: 8, right: 8,
                              width: 22, height: 22, borderRadius: '50%',
                              backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Check style={{ width: 12, height: 12, color: preset.primary }} />
                            </div>
                          )}
                          {preset.tag && (
                            <div style={{
                              position: 'absolute', top: 0, right: 0,
                              backgroundColor: preset.tag === 'Premium' ? '#C8A951' : preset.tag === 'Trending' ? '#8B5CF6' : '#10B981',
                              color: '#FFFFFF', fontSize: '9px', fontWeight: 700,
                              padding: '2px 7px', borderRadius: '0 8px 0 8px',
                            }}>
                              {preset.tag}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-3" style={{ backgroundColor: isSelected ? preset.primary + '06' : '#FAFAFA' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1A1A1A' }}>{preset.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '2px' }}>{preset.mood}</div>
                          <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '2px' }}>{preset.tagline}</div>
                          {isSelected && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              <span style={{ fontSize: '0.65rem', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '1px 6px', borderRadius: '9999px', fontWeight: 600 }}>
                                {preset.font}
                              </span>
                              <span style={{ fontSize: '0.65rem', backgroundColor: '#F0FDF4', color: '#166534', padding: '1px 6px', borderRadius: '9999px', fontWeight: 600 }}>
                                {preset.layout}
                              </span>
                              <span style={{ fontSize: '0.65rem', backgroundColor: preset.theme === 'dark' ? '#1A1A1A' : '#F5F5F5', color: preset.theme === 'dark' ? '#FFFFFF' : '#374151', padding: '1px 6px', borderRadius: '9999px', fontWeight: 600 }}>
                                {preset.theme}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Tweaks */}
            {activeSection === 'customize' && (
              <div className="space-y-4">
                {/* App Identity */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-gray-900 mb-4" style={{ fontWeight: 600 }}>App Identity</h3>

                  {/* Logo Upload */}
                  <div className="mb-4">
                    <Label>App Logo</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-blue-400 cursor-pointer transition-colors bg-gray-50">
                      <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload logo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="app-name">App Name</Label>
                    <Input
                      id="app-name"
                      placeholder="My Business App"
                      value={appName}
                      onChange={e => setAppName(e.target.value)}
                      className="mt-2 h-11"
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
                    <Palette className="w-4 h-4 text-blue-500" /> Colors
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Primary Color</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {colorSwatches.map(c => (
                          <button
                            key={c}
                            onClick={() => setPrimaryColor(c)}
                            className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                            style={{ backgroundColor: c, borderColor: primaryColor === c ? '#1A1A1A' : 'transparent' }}
                          />
                        ))}
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                          title="Custom color"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Accent Color</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {colorSwatches.map(c => (
                          <button
                            key={c}
                            onClick={() => setAccentColor(c)}
                            className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                            style={{ backgroundColor: c, borderColor: accentColor === c ? '#1A1A1A' : 'transparent' }}
                          />
                        ))}
                        <input
                          type="color"
                          value={accentColor}
                          onChange={e => setAccentColor(e.target.value)}
                          className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                          title="Custom color"
                        />
                      </div>
                    </div>

                    {/* Theme */}
                    <div>
                      <Label className="text-sm">Theme</Label>
                      <div className="flex gap-3 mt-2">
                        {(['light', 'dark'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${
                              theme === t ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {t === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                            <span className="text-sm capitalize" style={{ fontWeight: theme === t ? 600 : 400 }}>{t}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Font Style */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
                    <Type className="w-4 h-4 text-purple-500" /> Typography
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(fontStyleInfo).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => setFontStyle(key)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                          fontStyle === key ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: key === 'bold' ? 900 : key === 'elegant' ? 400 : 600,
                            fontStyle: key === 'elegant' ? 'italic' : 'normal',
                            fontFamily: key === 'tech' ? 'monospace' : key === 'classic' ? 'Georgia, serif' : 'inherit',
                            color: fontStyle === key ? '#1D4ED8' : '#374151',
                          }}
                        >
                          {info.sample}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: fontStyle === key ? '#1D4ED8' : '#374151' }}>
                          {info.label}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{info.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout Style */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
                    <Layout className="w-4 h-4 text-green-500" /> Layout Style
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(layoutStyleInfo).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => setLayoutStyle(key)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                          layoutStyle === key ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span style={{ fontSize: '1.3rem' }}>{info.icon}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: layoutStyle === key ? '#1D4ED8' : '#374151' }}>
                          {info.label}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{info.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Button Style */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-gray-900 mb-4" style={{ fontWeight: 600 }}>Button Style</h3>
                  <div className="flex gap-3">
                    {(['rounded', 'pill', 'square'] as const).map(style => (
                      <button
                        key={style}
                        onClick={() => setButtonStyle(style)}
                        className={`flex-1 py-2 border-2 transition-all text-sm ${
                          buttonStyle === style ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                        style={{
                          borderRadius: style === 'pill' ? '9999px' : style === 'square' ? '6px' : '10px',
                          fontWeight: buttonStyle === style ? 600 : 400,
                        }}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-gray-900" style={{ fontWeight: 600 }}>Live Preview</h3>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Updates live</span>
                  </div>
                </div>
                <PhonePreview preset={livePreset} appName={appName} category={category} />

                {/* Selected Preset Info */}
                {selectedPresetId && (
                  <div
                    className="mt-5 p-3 rounded-xl border"
                    style={{ backgroundColor: livePreset.primary + '08', borderColor: livePreset.primary + '30' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: livePreset.primary }} />
                      <span className="text-sm" style={{ fontWeight: 600, color: livePreset.primary }}>
                        {presets.find(p => p.id === selectedPresetId)?.name ?? 'Custom'}
                      </span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {livePreset.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{livePreset.mood}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleContinue}
            className="gap-2 px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            style={{ fontSize: '1rem' }}
          >
            Preview Your App <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}