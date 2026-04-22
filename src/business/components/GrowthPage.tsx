import { useState } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import {
  TrendingUp, Star, Zap, MapPin, Bell, Eye, Target, BarChart2,
  ArrowRight, Lock, CheckCircle, Megaphone, Users, ShoppingBag,
  Award, Flame, ChevronUp
} from 'lucide-react';

const COMPETITORS: Record<string, Array<{ name: string; plan: 'free' | 'basic' | 'pro' | 'enterprise'; rank: number; clicks: number; rating: number; badge?: string }>> = {
  Electronics: [
    { name: 'TechZone Pro', plan: 'pro', rank: 1, clicks: 1840, rating: 4.8, badge: 'Featured' },
    { name: 'DigiMart', plan: 'enterprise', rank: 2, clicks: 1620, rating: 4.6, badge: 'Top Seller' },
    { name: 'Gadget World', plan: 'pro', rank: 3, clicks: 1210, rating: 4.5 },
    { name: 'You', plan: 'pro', rank: 4, clicks: 740, rating: 4.3 },
    { name: 'ElectroHub', plan: 'basic', rank: 5, clicks: 430, rating: 4.1 },
    { name: 'Spark Store', plan: 'free', rank: 6, clicks: 180, rating: 3.9 },
  ],
  Restaurant: [
    { name: 'Biryani Palace', plan: 'enterprise', rank: 1, clicks: 2200, rating: 4.9, badge: 'Featured' },
    { name: 'Taste of India', plan: 'pro', rank: 2, clicks: 1780, rating: 4.7, badge: 'Top Rated' },
    { name: 'Curry House', plan: 'pro', rank: 3, clicks: 1340, rating: 4.5 },
    { name: 'You', plan: 'pro', rank: 4, clicks: 820, rating: 4.4 },
    { name: 'Spice Garden', plan: 'basic', rank: 5, clicks: 510, rating: 4.2 },
    { name: 'Dhaba Express', plan: 'free', rank: 6, clicks: 190, rating: 3.8 },
  ],
  default: [
    { name: 'TopBrand Pro', plan: 'pro', rank: 1, clicks: 1650, rating: 4.8, badge: 'Featured' },
    { name: 'BrandMax', plan: 'enterprise', rank: 2, clicks: 1420, rating: 4.6 },
    { name: 'PremiumStore', plan: 'pro', rank: 3, clicks: 1100, rating: 4.5 },
    { name: 'You', plan: 'pro', rank: 4, clicks: 680, rating: 4.2 },
    { name: 'LocalShop', plan: 'basic', rank: 5, clicks: 390, rating: 4.0 },
    { name: 'BasicBiz', plan: 'free', rank: 6, clicks: 155, rating: 3.7 },
  ],
};

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280', basic: '#3b82f6', pro: '#fb923c', enterprise: '#f59e0b',
};

const AD_PACKAGES = [
  {
    id: 'spotlight',
    icon: Star,
    name: 'Spotlight Listing',
    price: 299,
    period: 'week',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b22, #fbbf2411)',
    tag: 'Most Popular',
    desc: 'Pin your business to the top of local search results in your category.',
    stats: ['3.8× more clicks', 'Top-3 placement', 'Gold star badge', 'Category pin'],
  },
  {
    id: 'push',
    icon: Bell,
    name: 'Push Blast',
    price: 199,
    period: 'blast',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f9731622, #fb923c11)',
    tag: '5,000+ users',
    desc: 'Send a push notification to all nearby Redeem Rocket users about your deal.',
    stats: ['5k+ app users notified', 'Geo-targeted 5km', 'Custom message', 'Instant delivery'],
  },
  {
    id: 'banner',
    icon: Megaphone,
    name: 'Home Banner',
    price: 499,
    period: 'week',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec489922, #f4346411)',
    tag: 'Max Reach',
    desc: 'Feature your business on the Redeem Rocket home screen banner carousel.',
    stats: ['10k+ daily impressions', 'Home screen placement', 'Custom creative', 'Click-through tracking'],
  },
  {
    id: 'flash',
    icon: Flame,
    name: 'Flash Deal Boost',
    price: 99,
    period: 'day',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef444422, #f9731611)',
    tag: 'Quick ROI',
    desc: 'Boost your flash deal to the top of the flash deals feed for a full day.',
    stats: ['Top of flash deals', 'Urgency badge', 'Timer display', 'Social sharing'],
  },
];

const GROWTH_STATS = [
  { label: 'Avg. extra revenue for Pro users', value: '₹42,000', sub: 'per month vs Free', color: '#22c55e' },
  { label: 'Increase in store visits', value: '4.3×', sub: 'with Featured badge', color: '#f97316' },
  { label: 'Customer reach with Push Blast', value: '5,200+', sub: 'within 5km radius', color: '#f59e0b' },
  { label: 'Businesses upgraded this month', value: '847', sub: 'in your city', color: '#ec4899' },
];

export function GrowthPage() {
  const { bizUser } = useBusinessContext();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [avgTicket, setAvgTicket] = useState(800);
  const [footfall, setFootfall] = useState(200);
  const [boostPackage, setBoostPackage] = useState<string | null>(null);

  const category = bizUser?.businessCategory ?? 'default';
  const competitors = COMPETITORS[category] ?? COMPETITORS.default;
  const yourEntry = competitors.find(c => c.name === 'You')!;
  const currentPlan = bizUser?.plan ?? 'free';

  const bg     = isDark ? '#080d20' : '#faf7f3';
  const card   = isDark ? '#0e1530' : '#ffffff';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text   = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg = isDark ? '#162040' : '#fdf6f0';
  const accent = '#f97316';

  // ROI calculator
  const currentMonthlyRevenue = avgTicket * footfall;
  const proBoostMultiplier = 4.3;
  const projectedRevenue = Math.round(currentMonthlyRevenue * proBoostMultiplier);
  const extraRevenue = projectedRevenue - currentMonthlyRevenue;
  const roi = Math.round((extraRevenue / 999) * 100); // vs Pro plan cost

  return (
    <div style={{ color: text, display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${accent}22, #fb923c11)`, borderRadius: 20, border: `1px solid ${accent}33`, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <TrendingUp size={22} color={accent} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: text }}>Grow Your Business</h1>
          </div>
          <p style={{ fontSize: 14, color: textMuted, lineHeight: 1.6 }}>
            See how you rank among competitors, run targeted ads, and unlock premium visibility to get more customers through your door.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {GROWTH_STATS.slice(0, 2).map(s => (
            <div key={s.label} style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, padding: '14px 18px', textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Analysis */}
      <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 3 }}>
              Your Competitive Position — {category}
            </h2>
            <p style={{ fontSize: 12, color: textMuted }}>
              Ranked #{yourEntry.rank} of {competitors.length} businesses within 5km
            </p>
          </div>
          <div style={{ padding: '6px 14px', borderRadius: 20, background: yourEntry.rank <= 2 ? '#22c55e22' : yourEntry.rank <= 4 ? '#f59e0b22' : '#ef444422', border: `1px solid ${yourEntry.rank <= 2 ? '#22c55e' : yourEntry.rank <= 4 ? '#f59e0b' : '#ef4444'}44`, fontSize: 12, fontWeight: 700, color: yourEntry.rank <= 2 ? '#22c55e' : yourEntry.rank <= 4 ? '#f59e0b' : '#ef4444' }}>
            Rank #{yourEntry.rank}
          </div>
        </div>
        <div>
          {competitors.map((biz, idx) => {
            const isYou = biz.name === 'You';
            const planColor = PLAN_COLORS[biz.plan];
            const maxClicks = competitors[0].clicks;
            return (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px',
                borderBottom: idx < competitors.length - 1 ? `1px solid ${border}` : 'none',
                background: isYou ? `${accent}11` : 'transparent',
              }}>
                {/* Rank */}
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: biz.rank <= 3 ? `${planColor}33` : isDark ? '#162040' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: biz.rank <= 3 ? planColor : textMuted, flexShrink: 0 }}>
                  {biz.rank}
                </div>

                {/* Name + badges */}
                <div style={{ flex: '0 0 160px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: isYou ? 800 : 600, color: isYou ? accent : text }}>
                      {isYou ? `${bizUser?.businessName ?? 'You'} (You)` : biz.name}
                    </span>
                    {biz.badge && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: planColor, background: `${planColor}22`, padding: '2px 6px', borderRadius: 4 }}>{biz.badge}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: planColor, fontWeight: 600 }}>{biz.plan.toUpperCase()} plan</span>
                </div>

                {/* Bar chart */}
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, background: isDark ? '#162040' : '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(biz.clicks / maxClicks) * 100}%`, background: isYou ? accent : planColor, borderRadius: 4, transition: 'width 0.5s' }} />
                  </div>
                </div>

                {/* Clicks */}
                <div style={{ flex: '0 0 80px', textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{biz.clicks.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: textMuted }}>clicks/mo</div>
                </div>

                {/* Rating */}
                <div style={{ flex: '0 0 60px', textAlign: 'right', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <Star size={12} color="#f59e0b" fill="#f59e0b" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: text }}>{biz.rating}</span>
                </div>

                {/* Lock for Free plan users */}
                {(biz.rank === 1 || biz.rank === 2) && currentPlan === 'free' && !isYou && (
                  <Lock size={14} color={textMuted} />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '14px 24px', background: isDark ? '#0f0f1e' : '#fdf6f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12, color: textMuted }}>
            💡 Upgrade to <strong style={{ color: '#fb923c' }}>Pro</strong> to get a Featured badge and move to the top 3 in your category
          </p>
          <button onClick={() => navigate('/subscription')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Get Featured <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Visibility gap */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Visibility score */}
        <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>Your Visibility Score</h3>
          <p style={{ fontSize: 12, color: textMuted, marginBottom: 20 }}>How visible you are vs. category leaders</p>
          {[
            { label: 'Your business', value: 34, color: accent },
            { label: 'Pro plan avg', value: 71, color: '#fb923c' },
            { label: 'Enterprise avg', value: 94, color: '#f59e0b' },
          ].map(row => (
            <div key={row.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: text }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.value}%</span>
              </div>
              <div style={{ height: 8, background: isDark ? '#162040' : '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${row.value}%`, background: row.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: '#ef444411', border: '1px solid #ef444433', fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
            ⚠️ You're missing <strong>66%</strong> of potential visibility — upgrade to close the gap
          </div>
        </div>

        {/* What you're missing */}
        <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>What You're Missing Out On</h3>
          <p style={{ fontSize: 12, color: textMuted, marginBottom: 20 }}>Features that top competitors are using</p>
          {[
            { feature: 'Featured badge on map', plan: 'Pro', locked: currentPlan === 'free' || currentPlan === 'basic', icon: Award },
            { feature: 'Priority in search results', plan: 'Basic+', locked: currentPlan === 'free', icon: ChevronUp },
            { feature: 'Push notification blasts', plan: 'Add-on', locked: false, icon: Bell },
            { feature: 'Multi-location presence', plan: 'Enterprise', locked: currentPlan !== 'enterprise', icon: MapPin },
            { feature: 'Home banner ads', plan: 'Add-on', locked: false, icon: Megaphone },
            { feature: 'Customer retargeting', plan: 'Enterprise', locked: currentPlan !== 'enterprise', icon: Target },
          ].map(({ feature, plan, locked, icon: Icon }) => (
            <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: locked ? isDark ? '#162040' : '#f3f4f6' : '#22c55e22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {locked ? <Lock size={13} color={textMuted} /> : <Icon size={13} color="#22c55e" />}
              </div>
              <span style={{ flex: 1, fontSize: 12, color: locked ? textMuted : text }}>{feature}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: locked ? textMuted : '#22c55e', background: locked ? isDark ? '#162040' : '#f3f4f6' : '#22c55e22', padding: '2px 8px', borderRadius: 4 }}>
                {locked ? plan : 'Active'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ad Packages */}
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: text, marginBottom: 4 }}>Boost with Ads</h2>
          <p style={{ fontSize: 13, color: textMuted }}>One-time boosts that don't require a plan upgrade. Pay only when you run them.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {AD_PACKAGES.map(pkg => {
            const Icon = pkg.icon;
            const isSelected = boostPackage === pkg.id;
            return (
              <div key={pkg.id} onClick={() => setBoostPackage(isSelected ? null : pkg.id)}
                style={{
                  background: isSelected ? pkg.gradient : card,
                  borderRadius: 18, border: `2px solid ${isSelected ? pkg.color : border}`,
                  padding: 20, cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: isSelected ? `0 0 20px ${pkg.color}33` : 'none',
                }}>
                {/* Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: `${pkg.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={pkg.color} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: pkg.color, background: `${pkg.color}22`, padding: '3px 8px', borderRadius: 10 }}>{pkg.tag}</span>
                </div>

                <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 6 }}>{pkg.name}</div>
                <div style={{ fontSize: 11, color: textMuted, lineHeight: 1.5, marginBottom: 14 }}>{pkg.desc}</div>

                <div style={{ marginBottom: 16 }}>
                  {pkg.stats.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <CheckCircle size={11} color={pkg.color} />
                      <span style={{ fontSize: 11, color: textMuted }}>{s}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: pkg.color }}>₹{pkg.price}</span>
                  <span style={{ fontSize: 11, color: textMuted }}>per {pkg.period}</span>
                </div>

                <button
                  onClick={e => { e.stopPropagation(); navigate('/subscription'); }}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                    background: isSelected ? pkg.color : `${pkg.color}22`,
                    color: isSelected ? '#fff' : pkg.color,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}>
                  {isSelected ? <><Zap size={13} /> Launch Campaign</> : <>Buy Now <ArrowRight size={13} /></>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROI Calculator */}
      <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, padding: 28 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: text, marginBottom: 4 }}>Revenue Impact Calculator</h2>
          <p style={{ fontSize: 12, color: textMuted }}>See how much extra revenue you could earn with Pro visibility</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Avg. Transaction Value (₹)</label>
              <input
                type="number"
                value={avgTicket}
                onChange={e => setAvgTicket(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${border}`, background: inputBg, color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Monthly Customers (footfall)</label>
              <input
                type="number"
                value={footfall}
                onChange={e => setFootfall(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${border}`, background: inputBg, color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: isDark ? '#162040' : '#fdf6f0', fontSize: 12, color: textMuted }}>
              Based on 4.3× avg increase in customers for Pro plan businesses vs Free/Basic
            </div>
          </div>

          {/* Current vs Projected */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '16px 20px', borderRadius: 14, background: isDark ? '#162040' : '#fdf6f0', border: `1px solid ${border}` }}>
              <div style={{ fontSize: 11, color: textMuted, marginBottom: 4 }}>Current Monthly Revenue</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: text }}>₹{currentMonthlyRevenue.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>with {currentPlan} plan</div>
            </div>
            <div style={{ padding: '16px 20px', borderRadius: 14, background: 'linear-gradient(135deg, #22c55e22, #16a34a11)', border: '1px solid #22c55e44' }}>
              <div style={{ fontSize: 11, color: '#22c55e', marginBottom: 4 }}>Projected with Pro Plan</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#22c55e' }}>₹{projectedRevenue.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 11, color: '#22c55e', marginTop: 2 }}>+₹{extraRevenue.toLocaleString('en-IN')} more/month</div>
            </div>
          </div>

          {/* ROI Summary */}
          <div style={{ padding: 20, borderRadius: 14, background: `linear-gradient(135deg, ${accent}22, #fb923c11)`, border: `1px solid ${accent}44` }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: accent, fontWeight: 600, marginBottom: 4 }}>Return on Investment</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: accent, lineHeight: 1 }}>{roi}%</div>
              <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>ROI in month 1</div>
            </div>
            <div style={{ fontSize: 12, color: textMuted, textAlign: 'center', lineHeight: 1.6, marginBottom: 16 }}>
              Pro plan costs ₹999/mo.<br />
              You'd earn ₹{extraRevenue.toLocaleString('en-IN')} extra = <strong style={{ color: accent }}>{roi}× your investment</strong>
            </div>
            <button onClick={() => navigate('/subscription')} style={{ width: '100%', padding: '11px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Upgrade to Pro <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Social proof strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {GROWTH_STATS.map(s => (
          <div key={s.label} style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: textMuted, marginTop: 4, lineHeight: 1.4 }}>{s.sub}</div>
            <div style={{ fontSize: 10, color: textMuted, marginTop: 2, fontStyle: 'italic' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: text, marginBottom: 20 }}>What Business Owners Say</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'Rahul Sharma', biz: 'TechZone Electronics, Delhi', plan: 'Enterprise', quote: 'After upgrading to Enterprise, my footfall tripled in 2 months. The featured badge on the map makes all the difference.', rating: 5 },
            { name: 'Priya Nair', biz: 'Spice Garden Restaurant, Mumbai', plan: 'Pro', quote: 'Push Blast notifications alone brought 60 new customers last Saturday. Best ₹199 I ever spent.', rating: 5 },
            { name: 'Amit Patel', biz: 'FreshMart Grocery, Pune', plan: 'Pro', quote: 'The ROI calculator was accurate — I\'m making ₹38,000 extra per month vs when I was on Free.', rating: 5 },
          ].map(t => (
            <div key={t.name} style={{ padding: 18, borderRadius: 14, background: isDark ? '#0f1838' : '#fdf6f0', border: `1px solid ${border}` }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={13} color="#f59e0b" fill="#f59e0b" />
                ))}
              </div>
              <p style={{ fontSize: 12, color: text, lineHeight: 1.6, marginBottom: 12, fontStyle: 'italic' }}>"{t.quote}"</p>
              <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{t.name}</div>
              <div style={{ fontSize: 11, color: textMuted }}>{t.biz}</div>
              <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: PLAN_COLORS[t.plan.toLowerCase()], background: `${PLAN_COLORS[t.plan.toLowerCase()]}22`, display: 'inline-block', padding: '2px 8px', borderRadius: 4 }}>{t.plan} Plan</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
