import React, { useState, useMemo } from 'react';
import {
  Zap, ChevronRight, CheckCircle2, Sparkles, Wand2, BrainCircuit,
  ShoppingBag, Users, MessageSquare, Zap as AutoIcon, Globe,
  Palette, Kanban, Terminal, Send, MoreVertical, Plus, BarChart3,
  Layers, Play, Clock, Target, Rocket, Bot, HandMetal, History,
  Monitor, Settings2, Shield, ArrowUpRight, Search, Bell, CreditCard,
  Globe2, Share2
} from 'lucide-react';

const DEFAULT_PREFERENCES = {
  products: true,
  leads: true,
  email: true,
  automation: true,
  social: true
};

const DEFAULT_THEME = {
  layout: 'visual',
  primary: '#6366f1',
  font: 'modern',
  brandName: 'My Business'
};

interface OnboardingProps {
  onComplete: (data: any) => void;
  businessType?: string;
}

export function SmartOnboarding({ onComplete, businessType = 'general' }: OnboardingProps) {
  const [phase, setPhase] = useState<'discovery' | 'showcase' | 'theme' | 'setup' | 'preview'>('discovery');
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [isGenerating, setIsGenerating] = useState(false);

  const featureShowcase = useMemo(() => [
    {
      id: 'products',
      name: 'Product Catalog',
      icon: ShoppingBag,
      color: 'blue',
      description: 'Showcase products with photos, descriptions, and pricing.',
      examples: 'Inventory, digital menu, product listing'
    },
    {
      id: 'leads',
      name: 'Lead Management',
      icon: Users,
      color: 'emerald',
      description: 'Track potential customers through your sales pipeline.',
      examples: 'Sales funnel, lead scoring, deal tracking'
    },
    {
      id: 'email',
      name: 'Email Campaigns',
      icon: MessageSquare,
      color: 'purple',
      description: 'Create automated email sequences for customers.',
      examples: 'Welcome series, follow-ups, campaigns'
    },
    {
      id: 'automation',
      name: 'Workflow Automation',
      icon: AutoIcon,
      color: 'amber',
      description: 'Create if-then rules that run automatically.',
      examples: 'Trigger-based actions, automation rules'
    },
    {
      id: 'social',
      name: 'Social Media',
      icon: Globe,
      color: 'pink',
      description: 'Post across all social platforms from one dashboard.',
      examples: 'Multi-platform posting, scheduling'
    }
  ], []);

  const handleComplete = () => {
    onComplete({
      preferences,
      theme,
      completedAt: new Date().toISOString(),
    });
  };

  if (phase === 'discovery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
        <div className="w-full md:w-80 bg-slate-900 p-8 text-white flex flex-col justify-between border-r border-slate-800 order-2 md:order-1">
          <div>
            <div className="flex items-center gap-2 mb-12">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/50">
                <Zap size={20} className="text-white" fill="white" />
              </div>
              <span className="font-black text-xl tracking-tight">ROCKET</span>
            </div>
            <div className="space-y-6">
              {[
                { id: 'discovery', label: 'Features', idx: 1 },
                { id: 'showcase', label: 'Showcase', idx: 2 },
                { id: 'theme', label: 'Theme', idx: 3 },
                { id: 'setup', label: 'Setup', idx: 4 },
                { id: 'preview', label: 'Preview', idx: 5 }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setPhase(s.id as any)}
                  className="w-full flex items-center gap-4 text-left group transition-all"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                    phase === s.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                  }`}>
                    {s.idx}
                  </div>
                  <span className={`text-sm font-bold capitalize transition-colors ${
                    phase === s.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                  }`}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className="flex-1 flex items-center justify-center p-8 md:p-12 order-1 md:order-2">
          <div className="max-w-2xl text-center">
            <div className="mb-8 inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/50">
                <Rocket size={40} className="text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-tight">
              Welcome to Rocket OS.
            </h1>
            <p className="text-slate-300 text-lg mb-12 leading-relaxed max-w-lg mx-auto">
              Let's build your business operating system. Start by selecting the features you need.
            </p>

            <div className="space-y-4 mb-12 text-left">
              {[
                { key: 'products', q: '📦 Products/Services?', desc: 'Manage your product catalog' },
                { key: 'leads', q: '👥 Lead Management?', desc: 'Track sales prospects' },
                { key: 'email', q: '📧 Email Campaigns?', desc: 'Automated customer messages' },
                { key: 'automation', q: '🤖 Workflow Automation?', desc: 'If-then rules that auto-run' },
                { key: 'social', q: '📱 Social Media?', desc: 'Post across all platforms' }
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-indigo-400/50 cursor-pointer group transition-all">
                  <input
                    type="checkbox"
                    checked={preferences[item.key as keyof typeof preferences]}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      [item.key]: e.target.checked
                    })}
                    className="w-5 h-5 rounded accent-indigo-500"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold">{item.q}</p>
                    <p className="text-slate-300 text-sm">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={() => setPhase('showcase')}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-indigo-500/50 transition-all group flex items-center gap-3 mx-auto"
            >
              Continue <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (phase === 'showcase') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 md:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-black mb-2 tracking-tight">Feature Showcase</h2>
            <p className="text-slate-600">Explore what each feature can do for your business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featureShowcase.map((feature) => {
              const IconComponent = feature.icon;
              const isSelected = preferences[feature.id as keyof typeof preferences];

              return (
                <button
                  key={feature.id}
                  onClick={() => setPreferences({
                    ...preferences,
                    [feature.id]: !preferences[feature.id as keyof typeof preferences]
                  })}
                  className={`p-6 rounded-3xl border-2 transition-all group text-left ${
                    isSelected
                      ? 'bg-indigo-100 border-indigo-300 shadow-lg'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isSelected ? 'bg-indigo-200 text-indigo-600' : 'bg-slate-100'
                  }`}>
                    <IconComponent size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{feature.name}</h3>
                  <p className="text-sm mb-3 opacity-80 leading-relaxed">{feature.description}</p>
                  <p className="text-xs opacity-60 font-mono">{feature.examples}</p>
                  {isSelected && (
                    <div className="mt-4 flex items-center gap-2 text-sm font-bold text-indigo-600">
                      <CheckCircle2 size={16} /> Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 justify-between">
            <button
              onClick={() => setPhase('discovery')}
              className="px-8 py-3 rounded-xl border-2 border-slate-300 font-bold text-slate-900 hover:bg-slate-100 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => setPhase('theme')}
              className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              Next → <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'theme') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 md:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-black mb-2 tracking-tight">Customize Your Theme</h2>
            <p className="text-slate-600">Make Rocket OS reflect your brand</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">Business Name</label>
                <input
                  type="text"
                  value={theme.brandName}
                  onChange={(e) => setTheme({ ...theme, brandName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium"
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">Primary Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={theme.primary}
                    onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                    className="w-16 h-12 rounded-xl cursor-pointer border-2 border-slate-300"
                  />
                  <input
                    type="text"
                    value={theme.primary}
                    onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-indigo-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 shadow-lg overflow-hidden">
              <div className="text-center mb-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Preview</h3>
                <div
                  className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white font-black shadow-lg"
                  style={{ backgroundColor: theme.primary }}
                >
                  RR
                </div>
                <h2 className="text-3xl font-black" style={{ color: theme.primary }}>
                  {theme.brandName}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border-2 border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Features Enabled</p>
                      <p className="text-2xl font-black" style={{ color: theme.primary }}>
                        {Object.values(preferences).filter(Boolean).length}
                      </p>
                    </div>
                    <BarChart3 size={32} className="opacity-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-between">
            <button
              onClick={() => setPhase('showcase')}
              className="px-8 py-3 rounded-xl border-2 border-slate-300 font-bold text-slate-900 hover:bg-slate-100 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => { setPhase('setup'); setIsGenerating(true); setTimeout(() => { setIsGenerating(false); setPhase('preview'); }, 2000); }}
              className="px-8 py-3 rounded-xl text-white font-bold hover:shadow-lg transition-all flex items-center gap-2"
              style={{ backgroundColor: theme.primary }}
            >
              <Wand2 size={18} /> AI Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mb-8 animate-spin">
            <Wand2 size={80} className="text-indigo-400 mx-auto" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Synthesizing Your OS...</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">
            Configuring modules and personalizing your dashboard.
          </p>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'preview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 md:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-emerald-100 mb-6">
              <CheckCircle2 size={56} className="text-emerald-600" />
            </div>
            <h2 className="text-5xl font-black mb-4 tracking-tight">System Initialized.</h2>
            <p className="text-slate-600 text-lg mb-12">Your Rocket OS is ready to launch!</p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-200 p-12 shadow-xl mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${theme.primary}20` }}>
                  <Rocket size={32} style={{ color: theme.primary }} />
                </div>
                <h3 className="font-black text-xl mb-2">{theme.brandName}</h3>
                <p className="text-slate-600 text-sm">Personalized OS</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-indigo-100">
                  <Layers size={32} className="text-indigo-600" />
                </div>
                <h3 className="font-black text-xl mb-2">{Object.values(preferences).filter(Boolean).length}</h3>
                <p className="text-slate-600 text-sm">Active modules</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-emerald-100">
                  <Sparkles size={32} className="text-emerald-600" />
                </div>
                <h3 className="font-black text-xl mb-2">Ready</h3>
                <p className="text-slate-600 text-sm">To launch</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleComplete}
              className="px-12 py-5 rounded-2xl text-white font-black text-xl hover:shadow-2xl transition-all flex items-center gap-3 mx-auto group"
              style={{ backgroundColor: theme.primary }}
            >
              <Play size={24} /> Launch Rocket OS
              <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default SmartOnboarding;
