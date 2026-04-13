import { getBusinessTypeKey } from '@/app/utils/businessType';

// Same category colors as the customer map (Home.tsx)
const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#f97316',
  grocery:    '#16a34a',
  pharmacy:   '#2563eb',
  salon:      '#db2777',
  hotel:      '#7c3aed',
  atm:        '#ca8a04',
  other:      '#475569',
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  grocery:    'Grocery',
  pharmacy:   'Pharmacy',
  salon:      'Salon & Beauty',
  hotel:      'Hotel',
  atm:        'ATM / Bank',
  other:      'Business',
};

interface MapPreviewCardProps {
  name: string;
  logo: string;
  category: string;
  address: string;
  isDark: boolean;
  offerCount?: number;
}

export function MapPreviewCard({ name, logo, category, address, isDark, offerCount = 0 }: MapPreviewCardProps) {
  const typeKey = getBusinessTypeKey(category || name);
  const catColor = CATEGORY_COLORS[typeKey] ?? '#475569';
  const catLabel = CATEGORY_LABELS[typeKey] ?? 'Business';

  const card   = isDark ? '#162040' : '#ffffff';
  const text   = isDark ? '#e2e8f0' : '#18100a';
  const muted  = isDark ? '#64748b' : '#9a7860';
  const border = isDark ? '#1c2a55' : '#e8d8cc';

  return (
    <div>
      {/* Label */}
      <div style={{ fontSize: 11, fontWeight: 600, color: muted, marginBottom: 8, letterSpacing: '0.05em' }}>
        👁 CUSTOMER VIEW PREVIEW
      </div>

      {/* Card — mimics MapBusinessPopup.tsx */}
      <div style={{
        background: card,
        borderRadius: 16,
        border: `1px solid ${border}`,
        overflow: 'hidden',
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.15)',
        maxWidth: 320,
      }}>
        {/* Colored header */}
        <div style={{
          background: `linear-gradient(135deg, ${catColor}dd, ${catColor}88)`,
          padding: '16px 16px 12px',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo circle */}
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              {logo || '🏪'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                {name || 'Your Business Name'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                }}>
                  {catLabel}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                  ⭐ 4.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px' }}>
          {/* Address */}
          {address && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>📍</span>
              <span style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}>{address}</span>
            </div>
          )}

          {/* Offers */}
          <div style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: isDark ? '#1c2a55' : '#fdf6f0',
            border: `1px solid ${border}`,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 4 }}>OFFERS</div>
            {offerCount > 0 ? (
              <div style={{ fontSize: 13, color: catColor, fontWeight: 600 }}>
                🏷️ {offerCount} active offer{offerCount !== 1 ? 's' : ''} available
              </div>
            ) : (
              <div style={{ fontSize: 12, color: muted }}>No active offers yet</div>
            )}
          </div>

          {/* Non-interactive CTA buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, padding: '9px', borderRadius: 10,
              background: isDark ? '#1c2a55' : '#f3f4f6',
              border: `1px solid ${border}`,
              textAlign: 'center', fontSize: 12, fontWeight: 600,
              color: muted, cursor: 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              opacity: 0.7,
            }}>
              🧭 Navigate
            </div>
            <div style={{
              flex: 1, padding: '9px', borderRadius: 10,
              background: `${catColor}22`,
              border: `1px solid ${catColor}44`,
              textAlign: 'center', fontSize: 12, fontWeight: 700,
              color: catColor, cursor: 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              opacity: 0.7,
            }}>
              🏪 Open Store
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ marginTop: 10, fontSize: 10, color: muted, textAlign: 'center' }}>
            This is how customers see your business on the map
          </div>
        </div>
      </div>
    </div>
  );
}
