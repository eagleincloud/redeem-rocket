import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Rocket, Zap, Palette, BarChart2, ChevronRight, Sparkles } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';

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
    <OnboardingLayout showProgress={false}>
      {/* Logo */}
      <div className="flex justify-center mb-20">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-lg opacity-75 animate-pulse"
            style={{
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
              backdropFilter: 'blur(32px)',
            }}
          />
          <div
            className="relative w-20 h-20 rounded-lg flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            }}
          >
            <Rocket className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Hero Text */}
      <div className="text-center mb-24">
        <div
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 mb-12 border border-blue-500/30"
          style={{
            background: 'linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Sparkles className="w-1 h-1 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-sm font-medium text-white/90">
            Trusted by 10,000+ businesses
          </span>
        </div>

        <h1 className="text-white mb-2 text-5xl font-black leading-tight tracking-tighter m-0">
          Redeem Rocket
        </h1>

        <p
          className="mb-6 text-xl font-semibold"
          style={{
            background: 'linear-gradient(to right, #93c5fd, #d8b4fe)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Build Your Branded Business App
        </p>

        <p className="text-white/70 leading-relaxed max-w-lg mx-auto text-base">
          Pick your category. Choose a style.{' '}
          <span className="text-blue-300 font-semibold">Launch in minutes.</span>
        </p>
      </div>

      {/* Category Pills */}
      <div className="mb-24">
        <p className="text-white/50 text-sm font-semibold mb-8 text-center uppercase tracking-wide">
          Supports 16+ industries
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {categoryPreviews.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10 cursor-default transition-all duration-200 hover:bg-white/10 hover:border-white/20"
              style={{
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span className="text-white/80 text-sm font-medium">
                {cat.name}
              </span>
            </div>
          ))}
          <div
            className="flex items-center px-2 py-1 rounded-full border border-blue-500/20"
            style={{
              background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))',
            }}
          >
            <span className="text-white/70 text-sm font-medium">
              +8 more categories
            </span>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-4 mb-20">
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.label}
              className="p-5 rounded-lg border border-white/10 bg-white/5 cursor-default transition-all duration-200 hover:bg-white/10 hover:border-white/20"
              style={{
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="w-10 h-10 rounded flex items-center justify-center mb-3"
                style={{
                  backgroundColor: feat.color + '33',
                  color: feat.color,
                }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-white font-semibold text-sm mb-1">
                {feat.label}
              </div>
              <div className="text-white/50 text-xs leading-relaxed">
                {feat.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Section */}
      <div className="flex flex-col gap-4">
        <Button
          onClick={() => navigate('/register/details')}
          className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg flex items-center justify-center gap-2"
        >
          Start Building Your App
          <ChevronRight className="w-5 h-5" />
        </Button>

        <p className="text-center text-white/40 text-xs m-0">
          💳 Free to set up • No credit card required • ✨ Cancel anytime
        </p>
      </div>
    </OnboardingLayout>
  );
}