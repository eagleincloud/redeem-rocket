import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { getAppData, clearAppData } from '@/business/utils/onboarding/appState';
import { getPresetById, categoryData } from '@/business/utils/onboarding/categoryStyles';
import { submitRegistration } from '@/business/lib/registrationAPI';
import { Monitor, Smartphone, ArrowLeft, Rocket, CheckCircle2, Loader2 } from 'lucide-react';

export default function Preview() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [appData, setAppData] = useState<any>(null);
  const [preset, setPreset] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = getAppData();
    setAppData(data);
    if (data.category && data.stylePresetId) {
      setPreset(getPresetById(data.category, data.stylePresetId));
    }
  }, []);

  const handleLaunch = async () => {
    if (!appData) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await submitRegistration(appData);
      console.log('Registration submitted:', result);

      // Clear stored data and redirect to dashboard
      clearAppData();

      // TODO: Redirect to email verification or dashboard
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit registration';
      setError(errorMessage);
      console.error('Launch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!appData) return null;

  const catInfo = categoryData[appData.category] ?? categoryData['Other'];
  const p = preset ?? {
    primary: appData.primaryColor || '#3B82F6',
    accent: appData.accentColor || '#8B5CF6',
    bg: appData.theme === 'dark' ? '#0A0A0A' : '#FFFFFF',
    surface: appData.theme === 'dark' ? '#1A1A1A' : '#F8FAFC',
    textPrimary: appData.theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
    textSecondary: appData.theme === 'dark' ? '#9CA3AF' : '#6B7280',
    theme: appData.theme || 'light',
    buttonStyle: appData.buttonStyle || 'rounded',
  };

  const displayName = appData.appName || appData.businessName || 'My App';
  const btnRadius = p.buttonStyle === 'pill' ? '9999px' : p.buttonStyle === 'square' ? '6px' : '10px';

  const CustomerView = () => (
    <div style={{ backgroundColor: p.bg, minHeight: '100%', fontFamily: 'inherit' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: p.surface }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.accent})` }}>
            <span style={{ fontSize: '1rem' }}>{catInfo.emoji}</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: p.textPrimary, fontSize: '0.95rem' }}>{displayName}</div>
            <div style={{ fontSize: '0.7rem', color: p.textSecondary }}>{appData.category || 'Business'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs text-white rounded-lg"
            style={{ backgroundColor: p.primary, borderRadius: btnRadius, fontWeight: 600 }}>
            Login
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-4 mt-4 rounded-2xl p-6 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.accent})` }}>
        <div style={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', right: 40, top: 10, width: 60, height: 60, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
          Welcome to {displayName}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', marginBottom: '16px' }}>
          {appData.category ? `Your trusted ${appData.category.toLowerCase()} partner` : 'Your business companion'}
        </div>
        <button style={{ backgroundColor: '#FFFFFF', color: p.primary, padding: '8px 20px', borderRadius: btnRadius, fontSize: '0.85rem', fontWeight: 700 }}>
          Get Started →
        </button>
      </div>

      {/* Features */}
      <div className="px-4 mt-5">
        <div style={{ fontWeight: 700, fontSize: '1rem', color: p.textPrimary, marginBottom: '12px' }}>
          What we offer
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Exclusive Offers', sub: 'Save with deals', emoji: '🏷️' },
            { label: 'Loyalty Points', sub: 'Earn & redeem', emoji: '⭐' },
            { label: 'Book Online', sub: 'Easy scheduling', emoji: '📅' },
            { label: 'Support', sub: '24/7 help', emoji: '💬' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl flex flex-col gap-2" style={{ backgroundColor: p.surface }}>
              <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: p.textPrimary }}>{item.label}</div>
              <div style={{ fontSize: '0.75rem', color: p.textSecondary }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Offer */}
      <div className="mx-4 mt-4 p-4 rounded-xl border-2" style={{ borderColor: p.primary + '30', backgroundColor: p.primary + '08' }}>
        <div style={{ fontWeight: 700, color: p.textPrimary, marginBottom: '4px' }}>🎁 New Member Offer</div>
        <div style={{ fontSize: '0.85rem', color: p.textSecondary, marginBottom: '12px' }}>
          Get 20% off your first purchase or booking!
        </div>
        <button className="w-full py-2.5 text-white text-sm"
          style={{ backgroundColor: p.primary, borderRadius: btnRadius, fontWeight: 600 }}>
          Redeem Now
        </button>
      </div>
    </div>
  );

  const BusinessView = () => (
    <div style={{ backgroundColor: p.bg, minHeight: '100%' }}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: p.surface, borderColor: p.primary + '20' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.accent})` }}>
            <span style={{ fontSize: '1.1rem' }}>{catInfo.emoji}</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: p.textPrimary }}>{displayName}</div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span style={{ fontSize: '0.75rem', color: p.textSecondary }}>Live & Active</span>
            </div>
          </div>
        </div>
        <Badge className="text-xs bg-green-100 text-green-700">🟢 Running</Badge>
      </div>

      {/* Stats */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Leads', value: '142', growth: '+12%', color: p.primary },
            { label: 'Conversions', value: '23', growth: '+18%', color: '#10B981' },
            { label: 'Revenue', value: '₹1.2L', growth: '+24%', color: p.accent || '#8B5CF6' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: p.surface }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: p.textSecondary, marginTop: '2px' }}>{stat.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '4px' }}>{stat.growth} ↑</div>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: p.surface }}>
          <div style={{ fontWeight: 600, color: p.textPrimary, marginBottom: '12px', fontSize: '0.9rem' }}>
            Leads vs Revenue (Last 7 days)
          </div>
          <div className="flex items-end gap-2 h-24">
            {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md" style={{
                height: `${h}%`,
                background: i === 5 ? `linear-gradient(to top, ${p.primary}, ${p.accent})` : p.primary + '40',
              }} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <span key={d} style={{ fontSize: '0.65rem', color: p.textSecondary, flex: 1, textAlign: 'center' }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div style={{ fontWeight: 600, color: p.textPrimary, marginBottom: '10px', fontSize: '0.9rem' }}>
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '+ Add Lead', emoji: '👤' },
              { label: '📣 Send Campaign', emoji: '📣' },
              { label: '🏷️ Create Offer', emoji: '🏷️' },
              { label: '📊 View Reports', emoji: '📊' },
            ].map((action, i) => (
              <button
                key={i}
                className="p-3 text-white text-sm flex items-center gap-2"
                style={{ backgroundColor: p.primary, borderRadius: btnRadius, fontWeight: 600 }}
              >
                <span>{action.emoji}</span>
                <span style={{ fontSize: '0.8rem' }}>{action.label.replace(/^[^\s]+ /, '')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate('/customize')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Customize
          </Button>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h2 className="text-gray-900" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                Your App is Ready!
              </h2>
            </div>
            <p className="text-gray-500 text-sm">Preview both customer and business views</p>
          </div>
          <div className="w-32" />
        </div>

        {/* Style Summary Bar */}
        {preset && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-4 flex-wrap"
            style={{ background: `linear-gradient(135deg, ${p.primary}15, ${p.accent}15)`, border: `1px solid ${p.primary}30` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.accent }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: p.primary }}>{preset.name}</span>
            </div>
            <Badge variant="secondary">{catInfo.emoji} {appData.category}</Badge>
            <Badge variant="secondary">{preset.mood}</Badge>
            <Badge variant="secondary">{preset.font} font</Badge>
            <Badge variant="secondary">{preset.layout} layout</Badge>
            <Badge variant="secondary">{preset.theme === 'dark' ? '🌙 Dark' : '☀️ Light'} theme</Badge>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100 flex gap-1">
            {(['mobile', 'desktop'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all ${
                  viewMode === mode ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
                style={{ fontWeight: viewMode === mode ? 600 : 400 }}
              >
                {mode === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)} View
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Customer View */}
          <div>
            <div className="text-center mb-4">
              <Badge className="bg-blue-100 text-blue-700">👤 Customer App</Badge>
              <p className="text-xs text-gray-500 mt-1">What your customers see</p>
            </div>
            {viewMode === 'mobile' ? (
              <div className="flex justify-center">
                <div className="w-72 border-8 border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <div className="h-5 bg-gray-800" />
                  <div className="overflow-y-auto" style={{ maxHeight: '580px' }}>
                    <CustomerView />
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-4 border-gray-300 rounded-xl overflow-hidden shadow-lg" style={{ maxHeight: '550px', overflow: 'auto' }}>
                <CustomerView />
              </div>
            )}
          </div>

          {/* Business View */}
          <div>
            <div className="text-center mb-4">
              <Badge className="bg-purple-100 text-purple-700">🏢 Business Dashboard</Badge>
              <p className="text-xs text-gray-500 mt-1">Your management view</p>
            </div>
            {viewMode === 'mobile' ? (
              <div className="flex justify-center">
                <div className="w-72 border-8 border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <div className="h-5 bg-gray-800" />
                  <div className="overflow-y-auto" style={{ maxHeight: '580px' }}>
                    <BusinessView />
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-4 border-gray-300 rounded-xl overflow-hidden shadow-lg" style={{ maxHeight: '550px', overflow: 'auto' }}>
                <BusinessView />
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-4 justify-center mt-10">
          <Button
            variant="outline"
            onClick={() => navigate('/customize')}
            className="px-8 py-5 gap-2"
            disabled={isLoading}
          >
            ← Edit Design
          </Button>
          <Button
            onClick={handleLaunch}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-5 gap-2"
            style={{ fontSize: '1rem' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Go Live! 🚀
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}