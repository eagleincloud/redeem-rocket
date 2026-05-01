/**
 * Figma-Integrated Smart Onboarding
 * Complete onboarding flow with beautiful design presets
 */

import React, { useState } from 'react';
import { Rocket, ChevronRight, Check, Sparkles, Palette, Package, Users, Mail, Bot, Globe, ArrowRight } from 'lucide-react';
import { EnhancedFeatureSelection } from './EnhancedFeatureSelection';
import { categoryData, StylePreset, getPresetsForCategory } from './FigmaDesignSystem';

type Phase = 'welcome' | 'features' | 'business' | 'style' | 'preview' | 'complete';

interface OnboardingState {
  businessType: string;
  businessName: string;
  selectedFeatures: string[];
  selectedStyle: StylePreset | null;
  theme: {
    primary: string;
    brandName: string;
  };
}

export function FigmaSmartOnboarding({ onComplete }: { onComplete?: (data: any) => void }) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [state, setState] = useState<OnboardingState>({
    businessType: '',
    businessName: '',
    selectedFeatures: ['products', 'leads', 'email', 'automation', 'social'],
    selectedStyle: null,
    theme: { primary: '#6366f1', brandName: 'My Business' },
  });

  // ==================== WELCOME PHASE ====================
  if (phase === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          {/* Logo */}
          <div className="mb-8 inline-block">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/50">
              <Rocket className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Hero Text */}
          <h1 className="text-6xl font-black text-white mb-6 tracking-tight leading-tight">
            Redeem Rocket
          </h1>
          <p className="text-2xl text-blue-200 mb-4 font-semibold">
            Build Your Branded Business App
          </p>
          <p className="text-white/70 text-lg mb-12 max-w-lg mx-auto">
            Pick your category. Choose a style. Launch in minutes. Everything you need to succeed online.
          </p>

          {/* Category Grid */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            {Object.entries(categoryData).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => {
                  setState({ ...state, businessType: key });
                  setPhase('business');
                }}
                className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all group"
              >
                <div className="text-4xl mb-2">{cat.emoji}</div>
                <p className="text-white font-semibold text-sm">{cat.label}</p>
              </button>
            ))}
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: Sparkles, label: 'No coding needed' },
              { icon: Palette, label: 'Beautiful designs' },
              { icon: Rocket, label: 'Launch instantly' },
              { icon: Users, label: 'AI-powered' },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.label} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                  <Icon className="w-4 h-4 text-blue-400" />
                  <span className="text-white/80 text-sm">{feat.label}</span>
                </div>
              );
            })}
          </div>

          <p className="text-white/50 text-sm">Trusted by 10,000+ businesses • Free to start • No card required</p>
        </div>
      </div>
    );
  }

  // ==================== BUSINESS DETAILS PHASE ====================
  if (phase === 'business') {
    const categoryLabel = categoryData[state.businessType]?.label || 'Your Business';
    const categoryEmoji = categoryData[state.businessType]?.emoji || '🏢';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-4xl">{categoryEmoji}</span>
              <div>
                <p className="text-sm text-slate-600">You selected</p>
                <h2 className="text-3xl font-black text-slate-900">{categoryLabel}</h2>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 mb-8">
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-3">Business Name *</label>
              <input
                type="text"
                value={state.businessName}
                onChange={(e) => setState({ ...state, businessName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Enter your business name"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <button
                onClick={() => setPhase('welcome')}
                className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-bold hover:bg-slate-100 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => state.businessName && setPhase('features')}
                disabled={!state.businessName}
                className={`px-6 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  state.businessName
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                Next: Features <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== FEATURES PHASE ====================
  if (phase === 'features') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-black text-white mb-2">Choose Your Features</h2>
            <p className="text-slate-300">Select the features that match your business needs</p>
          </div>

          {/* Feature Selection */}
          <EnhancedFeatureSelection
            selectedFeatures={state.selectedFeatures}
            onFeaturesChange={(features) => setState({ ...state, selectedFeatures: features })}
          />

          {/* Navigation */}
          <div className="flex gap-4 mt-8 pt-8 border-t border-white/10">
            <button
              onClick={() => setPhase('business')}
              className="px-8 py-3 rounded-xl border-2 border-white/20 text-white font-bold hover:bg-white/10 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => setPhase('style')}
              className="ml-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:shadow-2xl transition-all flex items-center gap-2"
            >
              Choose Style <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STYLE PHASE ====================
  if (phase === 'style') {
    const presets = getPresetsForCategory(state.businessType);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-4xl font-black mb-2">Choose Your Design Style</h2>
            <p className="text-slate-600">Pick a beautiful template that matches your brand</p>
          </div>

          {/* Style Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setState({ ...state, selectedStyle: preset, theme: { ...state.theme, primary: preset.primary } })}
                className={`p-6 rounded-2xl border-3 transition-all text-left ${
                  state.selectedStyle?.id === preset.id
                    ? 'border-blue-600 shadow-xl'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
                style={
                  state.selectedStyle?.id === preset.id
                    ? { backgroundColor: `${preset.primary}10`, borderColor: preset.primary }
                    : { backgroundColor: preset.surface }
                }
              >
                {/* Preview */}
                <div
                  className="w-full h-32 rounded-xl mb-4 flex items-center justify-center text-white font-black text-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${preset.gradFrom}, ${preset.gradTo})`,
                  }}
                >
                  Preview
                </div>

                {/* Info */}
                <h3 className="font-black text-lg mb-1" style={{ color: preset.textPrimary }}>
                  {preset.name}
                </h3>
                <p className="text-sm mb-2" style={{ color: preset.textSecondary }}>
                  {preset.tagline}
                </p>
                <p className="text-xs font-semibold">{preset.mood}</p>

                {state.selectedStyle?.id === preset.id && (
                  <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold">
                    <Check className="w-5 h-5" /> Selected
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Business Name Input */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 p-6 mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-3">Business Display Name</label>
            <input
              type="text"
              value={state.theme.brandName}
              onChange={(e) => setState({ ...state, theme: { ...state.theme, brandName: e.target.value } })}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 transition-all"
              placeholder="e.g. Smith's Bistro"
            />
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={() => setPhase('features')}
              className="px-8 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-bold hover:bg-slate-100 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => state.selectedStyle && setPhase('preview')}
              disabled={!state.selectedStyle}
              className={`ml-auto px-8 py-3 rounded-xl font-bold text-white transition-all flex items-center gap-2 ${
                state.selectedStyle
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              Preview <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== PREVIEW PHASE ====================
  if (phase === 'preview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-5xl font-black mb-2">System Initialized.</h2>
            <p className="text-xl text-slate-600">Your Rocket OS is ready to launch!</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 p-6 text-center">
              <div
                className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-black text-2xl"
                style={{
                  background: `linear-gradient(135deg, ${state.selectedStyle?.gradFrom}, ${state.selectedStyle?.gradTo})`,
                }}
              >
                {state.theme.brandName.substring(0, 2).toUpperCase()}
              </div>
              <h3 className="font-black text-lg">{state.theme.brandName}</h3>
              <p className="text-slate-600 text-sm">Your branded app</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 p-6 text-center">
              <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center bg-blue-100">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-black text-lg">{state.selectedFeatures.length}</h3>
              <p className="text-slate-600 text-sm">Active features</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 p-6 text-center">
              <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center bg-emerald-100">
                <Sparkles className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-black text-lg">Ready</h3>
              <p className="text-slate-600 text-sm">To launch</p>
            </div>
          </div>

          {/* Launch Button */}
          <div className="text-center">
            <button
              onClick={() => {
                if (onComplete) {
                  onComplete({
                    businessType: state.businessType,
                    businessName: state.businessName,
                    selectedFeatures: state.selectedFeatures,
                    selectedStyle: state.selectedStyle,
                    theme: state.theme,
                  });
                }
                setPhase('complete');
              }}
              className="px-12 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-xl hover:shadow-2xl transition-all flex items-center gap-3 mx-auto"
            >
              <Rocket className="w-6 h-6" /> Launch Rocket OS
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== COMPLETE PHASE ====================
  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8 animate-bounce">
            <Rocket className="w-24 h-24 text-blue-400 mx-auto" />
          </div>
          <h1 className="text-5xl font-black text-white mb-4">Launching...</h1>
          <p className="text-white/70 text-lg">Initializing your business operating system</p>
          <div className="mt-8 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
