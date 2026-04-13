import { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { Check, Zap, X, CreditCard, ArrowRight, Star } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { logActivity } from '@/app/api/supabase-data';
import { toast } from 'sonner';

type PlanId = 'free' | 'basic' | 'pro' | 'enterprise';

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  billingPeriod: string;
  color: string;
  gradient: string;
  badge?: string;
  features: string[];
  limits: { products: string; offers: string; analytics: string; support: string; };
}

const PLANS: Plan[] = [
  {
    id: 'free', name: 'Free', price: 0, billingPeriod: 'Forever', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b728033, #9ca3af11)',
    features: ['5 products in catalog', '2 active offers', 'Basic dashboard', 'Customer requirements access', 'Standard listing'],
    limits: { products: '5', offers: '2', analytics: 'Basic', support: 'Community' },
  },
  {
    id: 'basic', name: 'Basic', price: 499, billingPeriod: '/month', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f633, #60a5fa11)',
    features: ['50 products in catalog', '10 active offers', 'Full analytics dashboard', 'Priority listing in search', 'Email support', 'Auction participation'],
    limits: { products: '50', offers: '10', analytics: 'Full', support: 'Email' },
  },
  {
    id: 'pro', name: 'Pro', price: 999, billingPeriod: '/month', color: '#fb923c', gradient: 'linear-gradient(135deg, #fb923c33, #a78bfa11)',
    badge: 'Most Popular',
    features: ['Unlimited products', 'Unlimited offers', 'Advanced analytics + exports', 'Featured badge on map', 'Auction hosting', 'Photo gallery (6 slots)', 'Priority support', 'Customer insights'],
    limits: { products: 'Unlimited', offers: 'Unlimited', analytics: 'Advanced', support: 'Priority' },
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 2999, billingPeriod: '/month', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b33, #fbbf2411)',
    badge: 'Best Value',
    features: ['Everything in Pro', 'Dedicated account manager', 'Custom integrations via API', 'Multi-location management', 'SLA guarantee (99.9%)', 'Priority placement', 'Advanced reporting', 'Phone support'],
    limits: { products: 'Unlimited', offers: 'Unlimited', analytics: 'Enterprise', support: 'Phone + Manager' },
  },
];

const COMPARISON_FEATURES = [
  { feature: 'Products', free: '5', basic: '50', pro: '∞', enterprise: '∞' },
  { feature: 'Active Offers', free: '2', basic: '10', pro: '∞', enterprise: '∞' },
  { feature: 'Auction Hosting', free: '✗', basic: 'Bid only', pro: '✓', enterprise: '✓' },
  { feature: 'Analytics', free: 'Basic', basic: 'Full', pro: 'Advanced', enterprise: 'Enterprise' },
  { feature: 'Featured Badge', free: '✗', basic: '✗', pro: '✓', enterprise: '✓' },
  { feature: 'API Access', free: '✗', basic: '✗', pro: '✗', enterprise: '✓' },
  { feature: 'Support', free: 'Community', basic: 'Email', pro: 'Priority', enterprise: 'Phone + Manager' },
  { feature: 'Multi-location', free: '✗', basic: '✗', pro: '✗', enterprise: '✓' },
];

export function SubscriptionPage() {
  const { bizUser, updatePlan } = useBusinessContext();
  const { isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg = isDark ? '#162040' : '#fdf6f0';
  const accent  = '#f97316';

  const currentPlan = bizUser?.plan ?? 'free';
  const yearlyDiscount = 0.8; // 20% off

  function getPlanPrice(plan: Plan) {
    if (plan.price === 0) return 0;
    return billingCycle === 'yearly' ? Math.floor(plan.price * yearlyDiscount) : plan.price;
  }

  async function handleUpgrade(planId: PlanId) {
    if (planId === currentPlan) return;
    setSelectedPlan(planId);
    setUpgrading(true);

    try {
      // Update Supabase
      if (supabase && bizUser?.businessId) {
        const { error } = await supabase
          .from('biz_users')
          .update({ plan: planId })
          .eq('business_id', bizUser.businessId);

        if (error) throw error;
      }

      // Update context
      updatePlan(planId);

      // Log activity
      logActivity({
        businessId: bizUser!.businessId!,
        actorId: bizUser!.id,
        actorType: bizUser!.isTeamMember ? 'team_member' : 'owner',
        actorName: bizUser!.name,
        action: 'update',
        entityType: 'subscription',
        entityId: '',
        entityName: `Plan: ${planId}`,
        metadata: { previousPlan: currentPlan, newPlan: planId, billingCycle },
      });

      setUpgraded(true);
      toast.success(`Upgraded to ${PLANS.find(p => p.id === planId)?.name} plan`);
    } catch (err) {
      toast.error('Failed to update subscription');
      console.error(err);
    } finally {
      setUpgrading(false);
      setTimeout(() => { setSelectedPlan(null); setUpgraded(false); }, 2000);
    }
  }

  function getButtonLabel(plan: Plan) {
    if (plan.id === currentPlan) return 'Current Plan';
    const currentIdx = PLANS.findIndex(p => p.id === currentPlan);
    const planIdx = PLANS.findIndex(p => p.id === plan.id);
    return planIdx > currentIdx ? 'Upgrade' : 'Downgrade';
  }

  function isUpgrade(planId: PlanId) {
    const currentIdx = PLANS.findIndex(p => p.id === currentPlan);
    const planIdx = PLANS.findIndex(p => p.id === planId);
    return planIdx > currentIdx;
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: text, marginBottom: 8 }}>Choose Your Plan</h1>
        <p style={{ fontSize: 14, color: textMuted, marginBottom: 20 }}>
          Current plan: <strong style={{ color: PLANS.find(p => p.id === currentPlan)?.color }}>{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</strong>
        </p>
        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: isDark ? '#162040' : '#f3f4f6', borderRadius: 30, padding: 4, gap: 4 }}>
          {(['monthly', 'yearly'] as const).map(cycle => (
            <button key={cycle} onClick={() => setBillingCycle(cycle)} style={{ padding: '8px 20px', borderRadius: 24, border: 'none', background: billingCycle === cycle ? card : 'transparent', color: billingCycle === cycle ? text : textMuted, cursor: 'pointer', fontSize: 13, fontWeight: billingCycle === cycle ? 700 : 400, boxShadow: billingCycle === cycle ? '0 1px 4px rgba(0,0,0,0.15)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
              {cycle === 'yearly' && <Star size={13} color="#f59e0b" fill="#f59e0b" />}
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
              {cycle === 'yearly' && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>-20%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentPlan;
          const isSelected = selectedPlan === plan.id;
          const price = getPlanPrice(plan);

          return (
            <div key={plan.id} style={{ background: card, borderRadius: 20, border: `2px solid ${isCurrent ? plan.color : isSelected ? plan.color : border}`, padding: 22, position: 'relative', transition: 'all 0.2s', boxShadow: isCurrent ? `0 0 20px ${plan.color}33` : 'none' }}>
              {/* Badge */}
              {(plan.badge || isCurrent) && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: 20, background: isCurrent ? plan.color : plan.id === 'pro' ? plan.color : '#f59e0b', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                  {isCurrent ? '✓ Current Plan' : plan.badge}
                </div>
              )}

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: isCurrent || plan.badge ? 8 : 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: plan.color, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: text }}>
                  {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                  {price > 0 && <span style={{ fontSize: 13, fontWeight: 500, color: textMuted }}>/mo</span>}
                </div>
                {billingCycle === 'yearly' && price > 0 && (
                  <div style={{ fontSize: 11, color: '#22c55e', marginTop: 4 }}>
                    ₹{(price * 12).toLocaleString('en-IN')}/year (save ₹{(plan.price * 12 - price * 12).toLocaleString('en-IN')})
                  </div>
                )}
              </div>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: textMuted }}>
                    <Check size={13} color={plan.color} style={{ flexShrink: 0, marginTop: 1 }} />
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || (isSelected && (upgrading || upgraded))}
                style={{
                  width: '100%', padding: '11px', borderRadius: 12, border: 'none', cursor: isCurrent ? 'not-allowed' : 'pointer',
                  background: isCurrent ? `${plan.color}22` : isSelected && upgraded ? '#22c55e' : isUpgrade(plan.id) ? `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` : `${plan.color}22`,
                  color: isCurrent ? plan.color : isSelected && upgraded ? '#fff' : isUpgrade(plan.id) ? '#fff' : plan.color,
                  fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
                }}>
                {isSelected && upgrading ? (
                  <><Zap size={14} /> Processing...</>
                ) : isSelected && upgraded ? (
                  <><Check size={14} /> Upgraded!</>
                ) : isCurrent ? (
                  'Current Plan'
                ) : (
                  <>{getButtonLabel(plan)} <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: text }}>Full Feature Comparison</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: isDark ? '#0f1838' : '#fdf6f0' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: textMuted }}>Feature</th>
              {PLANS.map(p => (
                <th key={p.id} style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: p.id === currentPlan ? p.color : textMuted }}>
                  {p.name}
                  {p.id === currentPlan && <div style={{ fontSize: 10, fontWeight: 500, color: p.color }}>Current</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FEATURES.map((row, i) => (
              <tr key={row.feature} style={{ borderTop: `1px solid ${border}`, background: i % 2 === 0 ? 'transparent' : isDark ? '#0f0f1e' : '#fafafa' }}>
                <td style={{ padding: '11px 16px', fontWeight: 600, color: text }}>{row.feature}</td>
                {(['free', 'basic', 'pro', 'enterprise'] as const).map(planId => {
                  const value = row[planId];
                  const plan = PLANS.find(p => p.id === planId)!;
                  const isCur = planId === currentPlan;
                  return (
                    <td key={planId} style={{ padding: '11px 16px', textAlign: 'center', color: value === '✗' ? textMuted : isCur ? plan.color : text, fontWeight: isCur ? 700 : 400 }}>
                      {value === '✓' ? <Check size={16} color={plan.color} style={{ display: 'inline' }} /> : value === '✗' ? <X size={16} color={textMuted} style={{ display: 'inline' }} /> : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: isDark ? '#162040' : '#fdf6f0', border: `1px solid ${border}`, fontSize: 12, color: textMuted, lineHeight: 1.7 }}>
        <strong style={{ color: text }}>💳 Payment & Billing:</strong> Plans are billed monthly or yearly. Upgrades take effect immediately. Downgrading takes effect at next billing cycle. Cancel anytime from this page. All plans include a 7-day free trial.
      </div>
    </div>
  );
}
