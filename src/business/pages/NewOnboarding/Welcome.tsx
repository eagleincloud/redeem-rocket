import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Rocket, Zap, Palette, BarChart2, ChevronRight, Star, Sparkles } from 'lucide-react';

const features = [
  { icon: Zap, label: 'No coding required', sub: 'Build in minutes, not months', color: '#F59E0B' },
  { icon: Palette, label: 'Unique style per category', sub: '200+ presets for 16+ business types', color: '#8B5CF6' },
  { icon: BarChart2, label: 'AI-powered features', sub: 'Smart campaigns, analytics & automation', color: '#10B981' },
  { icon: Rocket, label: 'Launch instantly', sub: 'Go live with one click', color: '#3B82F6' },
];

const categoryPreviews = [
  { emoji: '🍽️', name: 'Restaurant' },
  { emoji: '💆', name: 'Salon & Spa' },
  { emoji: '💪', name: 'Fitness' },
  { emoji: '🏥', name: 'Healthcare' },
  { emoji: '🛍️', name: 'Retail' },
  { emoji: '🏠', name: 'Real Estate' },
  { emoji: '📚', name: 'Education' },
  { emoji: '💻', name: 'Technology' },
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-2xl w-full relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-75 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
              <Rocket className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full px-4 py-2 mb-6 border border-blue-400/30 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-300">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-white/90 text-sm font-medium">Trusted by 10,000+ businesses</span>
          </div>

          <h1 className="text-white mb-4" style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Redeem Rocket
          </h1>

          <p className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent mb-3" style={{ fontSize: '1.35rem', fontWeight: 600 }}>
            Build Your Branded Business App
          </p>

          <p className="text-white/70 leading-relaxed max-w-md mx-auto" style={{ fontSize: '1.05rem' }}>
            Pick your category. Choose a style. <span className="text-blue-300 font-semibold">Launch in minutes.</span>
          </p>
        </div>

        {/* Category Pills */}
        <div className="mb-12">
          <p className="text-white/50 text-sm font-semibold mb-4 text-center uppercase tracking-wider">Supports 16+ industries</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {categoryPreviews.map(cat => (
              <div
                key={cat.name}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default group"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{cat.emoji}</span>
                <span className="text-white/80 text-sm font-medium">{cat.name}</span>
              </div>
            ))}
            <div className="flex items-center px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20">
              <span className="text-white/70 text-sm font-medium">+8 more categories</span>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.label}
                className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-default"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: feat.color + '20', color: feat.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-white font-semibold text-sm mb-1">{feat.label}</div>
                <div className="text-white/50 text-xs leading-relaxed">{feat.sub}</div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate('/register/details')}
            className="w-full py-7 text-white font-bold gap-2 text-lg rounded-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            }}
          >
            Start Building Your App
            <ChevronRight className="w-5 h-5" />
          </Button>

          <p className="text-center text-white/40 text-xs">
            💳 Free to set up • No credit card required • ✨ Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}