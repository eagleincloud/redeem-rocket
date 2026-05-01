import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Rocket, Zap, Palette, BarChart2, ChevronRight, Star } from 'lucide-react';

const features = [
  { icon: Zap, label: 'No coding required', sub: 'Build in minutes, not months', color: '#F59E0B' },
  { icon: Palette, label: 'Unique style per category', sub: '200+ style presets across 16 business types', color: '#8B5CF6' },
  { icon: BarChart2, label: 'AI-powered features', sub: 'Smart campaigns, analytics & automation', color: '#10B981' },
  { icon: Rocket, label: 'Launch instantly', sub: 'Go live with one click', color: '#3B82F6' },
];

const categoryPreviews = [
  { emoji: '🍽️', name: 'Restaurant', color: '#EF4444' },
  { emoji: '💆', name: 'Salon & Spa', color: '#EC4899' },
  { emoji: '💪', name: 'Fitness', color: '#3B82F6' },
  { emoji: '🏥', name: 'Healthcare', color: '#10B981' },
  { emoji: '🛍️', name: 'Retail', color: '#F59E0B' },
  { emoji: '🏠', name: 'Real Estate', color: '#6366F1' },
  { emoji: '📚', name: 'Education', color: '#8B5CF6' },
  { emoji: '💻', name: 'Technology', color: '#06B6D4' },
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 flex items-center justify-center p-4 py-10">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
              <Rocket className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4 border border-white/20">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-white/80 text-sm">Trusted by 10,000+ businesses across India</span>
          </div>
          <h1 className="text-white mb-3" style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.15 }}>
            Redeem Rocket
          </h1>
          <p className="text-blue-200 mb-2" style={{ fontSize: '1.3rem', fontWeight: 500 }}>
            Build Your Branded Business App
          </p>
          <p className="text-white/60" style={{ fontSize: '1rem' }}>
            Pick your category. Choose a style. Launch in minutes.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categoryPreviews.map(cat => (
            <div
              key={cat.name}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm"
            >
              <span style={{ fontSize: '0.9rem' }}>{cat.emoji}</span>
              <span className="text-white/80 text-xs">{cat.name}</span>
            </div>
          ))}
          <div className="flex items-center px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
            <span className="text-white/60 text-xs">+8 more</span>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.label}
                className="flex items-start gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: feat.color + '25' }}
                >
                  <Icon className="w-4 h-4" style={{ color: feat.color }} />
                </div>
                <div>
                  <div className="text-white text-sm" style={{ fontWeight: 600 }}>{feat.label}</div>
                  <div className="text-white/50 text-xs mt-0.5">{feat.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate('/details')}
          className="w-full py-6 text-white gap-2 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            fontSize: '1.05rem',
            fontWeight: 700,
          }}
        >
          Start Building Your App
          <ChevronRight className="w-5 h-5" />
        </Button>

        <p className="text-center text-white/40 text-xs mt-4">
          Free to set up • No credit card required • Cancel anytime
        </p>
      </div>
    </div>
  );
}