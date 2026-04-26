import React, { useEffect, useState } from 'react';
import { Check, Loader, RefreshCw, Settings } from 'lucide-react';
import { ThemeConfig, ThemeGenerationResult, applyTheme } from '../../services/ai-theme-generator';

interface ThemePreviewPhaseProps {
  themeResult: ThemeGenerationResult;
  onApply: (theme: ThemeConfig) => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

export function ThemePreviewPhase({
  themeResult,
  onApply,
  onRegenerate,
  isLoading = false,
}: ThemePreviewPhaseProps) {
  const { theme, rationale, recommendations, confidence } = themeResult;
  const [previewApplied, setPreviewApplied] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig>(theme);

  // Preview theme when component mounts
  useEffect(() => {
    applyTheme(selectedTheme);
    setPreviewApplied(true);
  }, [selectedTheme]);

  const handleApply = () => {
    onApply(selectedTheme);
  };

  const handleColorChange = (colorKey: keyof ThemeConfig, value: string) => {
    const newTheme = { ...selectedTheme, [colorKey]: value };
    setSelectedTheme(newTheme);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">🎨 Your Custom Theme</h1>
          <p className="text-gray-300">AI-generated based on your business preferences</p>
        </div>

        {/* Confidence Score */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/50">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-sm">
              AI Confidence: {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Color Palette Preview */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
            <h2 className="text-2xl font-semibold mb-6">Color Palette</h2>

            {/* Color Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { key: 'primaryColor' as const, label: 'Primary', desc: 'Main brand color' },
                { key: 'secondaryColor' as const, label: 'Secondary', desc: 'Accent color' },
                { key: 'accentColor' as const, label: 'Accent', desc: 'Highlight color' },
                { key: 'successColor' as const, label: 'Success', desc: 'For success states' },
                { key: 'warningColor' as const, label: 'Warning', desc: 'For warnings' },
                { key: 'errorColor' as const, label: 'Error', desc: 'For errors' },
              ].map(({ key, label, desc }) => (
                <div key={key}>
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="color"
                      value={selectedTheme[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border border-slate-600"
                    />
                    <div>
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </div>
                  <code className="text-xs text-gray-400 bg-slate-700/50 px-2 py-1 rounded">
                    {selectedTheme[key]}
                  </code>
                </div>
              ))}
            </div>

            {/* Layout & Typography */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Layout Style</label>
                <select
                  value={selectedTheme.layout}
                  onChange={(e) =>
                    setSelectedTheme({
                      ...selectedTheme,
                      layout: e.target.value as ThemeConfig['layout'],
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm"
                >
                  <option value="minimalist">Minimalist</option>
                  <option value="data-heavy">Data Heavy</option>
                  <option value="visual-focused">Visual Focused</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Font Style</label>
                <select
                  value={selectedTheme.fontFamily}
                  onChange={(e) =>
                    setSelectedTheme({
                      ...selectedTheme,
                      fontFamily: e.target.value as ThemeConfig['fontFamily'],
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm"
                >
                  <option value="modern">Modern</option>
                  <option value="traditional">Traditional</option>
                  <option value="playful">Playful</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>
          </div>

          {/* Design Recommendation */}
          <div className="mt-6 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-3">Why This Theme?</h3>
            <p className="text-gray-300 mb-4">{rationale}</p>

            <div>
              <p className="text-sm font-semibold mb-2">AI Recommendations:</p>
              <ul className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Live Preview Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4">Live Preview</h3>

            {/* Mini Dashboard Preview */}
            <div
              className="rounded-lg p-4 mb-4"
              style={{
                backgroundColor: selectedTheme.backgroundColor,
                color: selectedTheme.textColor,
              }}
            >
              <div className="space-y-3">
                <div
                  className="h-8 rounded px-3 flex items-center font-semibold"
                  style={{ backgroundColor: selectedTheme.primaryColor }}
                >
                  Primary Button
                </div>
                <div
                  className="h-8 rounded px-3 flex items-center"
                  style={{
                    backgroundColor: selectedTheme.secondaryColor,
                    color: '#fff',
                  }}
                >
                  Secondary Button
                </div>
                <div
                  className="h-1 rounded"
                  style={{ backgroundColor: selectedTheme.accentColor }}
                />
                <div className="text-sm space-y-2">
                  <div
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: selectedTheme.successColor + '20' }}
                  >
                    Success message
                  </div>
                  <div
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: selectedTheme.errorColor + '20' }}
                  >
                    Error message
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleApply}
                disabled={isLoading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Apply Theme
                  </>
                )}
              </button>

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  disabled={isLoading}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Regenerate
                </button>
              )}

              <button
                onClick={() => setSelectedTheme(theme)}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition flex items-center justify-center gap-2"
              >
                <Settings size={16} />
                Reset to Original
              </button>
            </div>

            {/* Theme Settings Info */}
            <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-200">
              <p className="font-semibold mb-1">💡 Tip</p>
              <p>You can customize these colors anytime from your settings.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemePreviewPhase;
