import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useViewport } from '../hooks/useViewport';
import { Megaphone, Share2, Instagram, Clock, Copy, Check, ExternalLink, Download, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { fetchOwnOffers } from '@/app/api/supabase-data';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  price: number;
  status: 'approved' | 'pending_approval' | 'rejected' | 'expired';
}

type SubTab = 'share' | 'instagram' | 'scheduled';

// ─── Sample active offers (replace with real Supabase fetch) ─────────────────
const SAMPLE_OFFERS: Offer[] = [
  { id: 'o1', title: 'Weekend Mega Sale', description: '40% off on all items this weekend!', discount: 40, price: 0, status: 'approved' },
  { id: 'o2', title: 'Flash Deal', description: 'Get 30% off on selected items. Limited stock!', discount: 30, price: 580, status: 'approved' },
  { id: 'o3', title: 'New User Offer', description: 'First order: 25% off for new customers.', discount: 25, price: 0, status: 'approved' },
];

// ─── Share Offer Tab ──────────────────────────────────────────────────────────
function ShareOfferTab({ bizName, isDark, offers }: { bizName: string; isDark: boolean; offers: Offer[] }) {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(offers[0] ?? null);
  const [copied, setCopied] = useState(false);

  const card      = isDark ? '#0e1530' : '#ffffff';
  const border    = isDark ? '#1c2a55' : '#e8d8cc';
  const text      = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg   = isDark ? '#162040' : '#fdf6f0';
  const accent    = '#f97316';

  const appUrl = window.location.origin;
  const shareMessage = selectedOffer
    ? `🎉 ${bizName} has a special offer for you!\n\n✨ ${selectedOffer.title}\n${selectedOffer.description}\n💰 ${selectedOffer.discount}% OFF!\n\n🛍️ Shop now: ${appUrl}`
    : '';

  function handleWebShare() {
    if (!selectedOffer) return;
    if ('share' in navigator) {
      navigator.share({
        title: `${bizName} — ${selectedOffer.title}`,
        text: shareMessage,
        url: appUrl,
      }).catch(() => {});
    } else {
      toast.error('Web Share not supported on this browser');
    }
  }

  function handleCopy() {
    if (!shareMessage) return;
    navigator.clipboard.writeText(shareMessage).then(() => {
      setCopied(true);
      toast.success('Message copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(shareMessage)}`;
  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Step 1: Select offer */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 12 }}>Step 1 — Select an offer</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {offers.map((offer) => (
            <button
              key={offer.id}
              onClick={() => setSelectedOffer(offer)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                background: selectedOffer?.id === offer.id ? `${accent}22` : inputBg,
                border: `1px solid ${selectedOffer?.id === offer.id ? accent : border}`,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 20 }}>🏷️</span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: text, margin: 0 }}>{offer.title}</p>
                <p style={{ fontSize: 11, color: textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer.description}</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: accent, flexShrink: 0 }}>{offer.discount}% off</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Message preview */}
      {selectedOffer && (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 12 }}>Step 2 — Share your offer</p>
          <div style={{
            background: inputBg, border: `1px solid ${border}`, borderRadius: 8,
            padding: 14, marginBottom: 16,
            fontSize: 12, color: textMuted, lineHeight: 1.7,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {shareMessage}
          </div>

          {/* Share buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {/* Web Share (mobile-first) */}
            {'share' in navigator && (
              <button
                onClick={handleWebShare}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px',
                  borderRadius: 8, background: accent, color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                <Share2 size={15} />
                Share
              </button>
            )}

            {/* WhatsApp */}
            <a
              href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px',
                borderRadius: 8, background: '#25d366', color: '#fff',
                textDecoration: 'none', fontSize: 13, fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 15 }}>💬</span>
              WhatsApp
            </a>

            {/* Facebook */}
            <a
              href={facebookUrl} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px',
                borderRadius: 8, background: '#1877f2', color: '#fff',
                textDecoration: 'none', fontSize: 13, fontWeight: 600,
              }}
            >
              <ExternalLink size={14} />
              Facebook
            </a>

            {/* Twitter/X */}
            <a
              href={twitterUrl} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px',
                borderRadius: 8, background: '#000', color: '#fff',
                textDecoration: 'none', fontSize: 13, fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 900 }}>𝕏</span>
              Twitter
            </a>

            {/* Copy */}
            <button
              onClick={handleCopy}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px',
                borderRadius: 8, background: inputBg, color: copied ? '#22c55e' : textMuted,
                border: `1px solid ${border}`, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Instagram Tab ────────────────────────────────────────────────────────────
function InstagramTab({ bizName, isDark, offers }: { bizName: string; isDark: boolean; offers: Offer[] }) {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(offers[0] ?? null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const card      = isDark ? '#0e1530' : '#ffffff';
  const border    = isDark ? '#1c2a55' : '#e8d8cc';
  const text      = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg   = isDark ? '#162040' : '#fdf6f0';
  const accent    = '#f97316';

  // Draw preview card on canvas whenever offer/biz changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedOffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080, H = 1080;
    canvas.width  = W;
    canvas.height = H;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Decorative orange circle
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.15, 260, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249,115,22,0.12)';
    ctx.fill();

    // Business emoji (large)
    ctx.font = 'bold 160px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🏪', W / 2, 300);

    // Business name
    ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.fillText(bizName.slice(0, 24), W / 2, 420);

    // Offer title
    ctx.font = '500 48px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    const title = selectedOffer.title.slice(0, 32);
    ctx.fillText(title, W / 2, 510);

    // Discount badge (pill)
    const discText = `${selectedOffer.discount}% OFF`;
    ctx.font = 'bold 80px system-ui, -apple-system, sans-serif';
    const tw = ctx.measureText(discText).width;
    const px = 40, py = 24;
    const rx = (W - tw - px * 2) / 2, ry = 580;
    const rw = tw + px * 2, rh = 110;

    // Rounded rect
    ctx.beginPath();
    const r = 55;
    ctx.moveTo(rx + r, ry);
    ctx.lineTo(rx + rw - r, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
    ctx.lineTo(rx + rw, ry + rh - r);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
    ctx.lineTo(rx + r, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
    ctx.lineTo(rx, ry + r);
    ctx.quadraticCurveTo(rx, ry, rx + r, ry);
    ctx.closePath();
    const btnGrad = ctx.createLinearGradient(rx, ry, rx + rw, ry);
    btnGrad.addColorStop(0, '#f97316');
    btnGrad.addColorStop(1, '#fb923c');
    ctx.fillStyle = btnGrad;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(discText, W / 2, ry + rh - py + 10);

    // Description
    ctx.font = '400 36px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    const desc = selectedOffer.description.slice(0, 50);
    ctx.fillText(desc, W / 2, 770);

    // Branding
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#f97316';
    ctx.textAlign = 'center';
    ctx.fillText('redeemrocket.app', W / 2, 970);

    ctx.font = '300 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText('Scan the app to redeem your offer', W / 2, 1015);
  }, [selectedOffer, bizName]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `offer-${selectedOffer?.id ?? 'post'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Instagram post downloaded!');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Offer selector */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 12 }}>Select offer to showcase</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {offers.map((offer) => (
            <button
              key={offer.id}
              onClick={() => setSelectedOffer(offer)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: selectedOffer?.id === offer.id ? `${accent}22` : inputBg,
                border: `1px solid ${selectedOffer?.id === offer.id ? accent : border}`,
                color: selectedOffer?.id === offer.id ? accent : textMuted,
                cursor: 'pointer',
              }}
            >
              {offer.title} ({offer.discount}% off)
            </button>
          ))}
        </div>
      </div>

      {/* Canvas preview */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 12 }}>Instagram post preview (1080×1080)</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%', maxWidth: 320, height: 'auto',
              borderRadius: 8, border: `1px solid ${border}`,
            }}
          />
        </div>

        <button
          onClick={handleDownload}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', justifyContent: 'center',
            padding: '11px 20px', borderRadius: 10,
            background: `linear-gradient(135deg, #e1306c, #fd1d1d)`,
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 700,
          }}
        >
          <Download size={16} />
          Download Image
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        background: isDark ? '#0f1838' : '#fdf6f0',
        border: `1px solid ${border}`, borderRadius: 10, padding: 14,
        fontSize: 12, color: textMuted, lineHeight: 1.7,
      }}>
        <p style={{ fontWeight: 600, color: text, marginBottom: 6 }}>📲 How to post on Instagram</p>
        <ol style={{ paddingLeft: 18, margin: 0 }}>
          <li>Download the image above</li>
          <li>Open Instagram and tap the + icon</li>
          <li>Select the downloaded image from your gallery</li>
          <li>Write a caption and add relevant hashtags</li>
          <li>Share to your feed or story!</li>
        </ol>
      </div>
    </div>
  );
}

// ─── Scheduled Tab ────────────────────────────────────────────────────────────
function ScheduledTab({ isDark }: { isDark: boolean }) {
  const card   = isDark ? '#0e1530' : '#ffffff';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text   = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';

  return (
    <div style={{
      background: card, border: `2px dashed ${border}`,
      borderRadius: 16, padding: 40,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', gap: 14, minHeight: 300,
    }}>
      <div style={{ fontSize: 48 }}>🗓️</div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: '#f59e0b22', border: '1px solid #f59e0b44',
        borderRadius: 20, padding: '4px 14px',
        fontSize: 11, fontWeight: 700, color: '#f59e0b',
        letterSpacing: '0.06em',
      }}>
        <Lock size={10} />
        COMING SOON
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: text, margin: 0 }}>Scheduled Posts</p>
      <p style={{ fontSize: 13, color: textMuted, maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
        Schedule your offers to be automatically shared across WhatsApp, Facebook, and Instagram at the best times — all from one place.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
        {['Auto-post offers', 'Best time AI', 'Multi-platform', 'Analytics'].map((feature) => (
          <span key={feature} style={{
            padding: '4px 10px', borderRadius: 20,
            background: isDark ? '#1c2a55' : '#f3f4f6',
            fontSize: 11, color: textMuted,
            border: `1px solid ${border}`,
          }}>
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function MarketingPage() {
  const { isDark } = useTheme();
  const { isMobile } = useViewport();
  const { bizUser } = useBusinessContext();
  const [activeTab, setActiveTab] = useState<SubTab>('share');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const bg        = isDark ? '#080d20' : '#faf7f3';
  const card      = isDark ? '#0e1530' : '#ffffff';
  const border    = isDark ? '#1c2a55' : '#e8d8cc';
  const text      = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const accent    = '#f97316';

  const bizName = bizUser?.businessName ?? 'My Business';
  const businessId = bizUser?.businessId || bizUser?.id;

  // Fetch real offers from DB
  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetchOwnOffers(businessId)
      .then(data => {
        if (data && data.length > 0) {
          const converted = data.map((o: any) => ({
            id: o.id,
            title: o.title,
            description: o.description || '',
            discount: o.discount || 0,
            price: o.price || 0,
            status: o.status || 'approved',
          }));
          setOffers(converted);
        }
      })
      .finally(() => setLoading(false));
  }, [businessId]);

  const TABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
    { key: 'share',     label: 'Share Offer',  icon: <Share2 size={14} /> },
    { key: 'instagram', label: 'Instagram',    icon: <Instagram size={14} /> },
    { key: 'scheduled', label: 'Scheduled',    icon: <Clock size={14} /> },
  ];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `linear-gradient(135deg, ${accent}33, #fb923c33)`,
          border: `1px solid ${accent}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Megaphone size={18} color={accent} />
        </div>
        <div>
          <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: text, margin: 0 }}>Marketing</h1>
          <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>Share your offers and grow your audience</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: 4,
        background: isDark ? '#0e1530' : '#f3f4f6',
        borderRadius: 12, marginBottom: 24,
        border: `1px solid ${border}`,
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, padding: '8px 12px', borderRadius: 8,
              background: activeTab === tab.key
                ? isDark ? '#162040' : '#ffffff'
                : 'transparent',
              border: activeTab === tab.key ? `1px solid ${border}` : '1px solid transparent',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              color: activeTab === tab.key ? accent : textMuted,
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.key === 'scheduled' && (
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 4,
                background: '#f59e0b22', color: '#f59e0b',
                border: '1px solid #f59e0b44', fontWeight: 700,
                marginLeft: 2,
              }}>SOON</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: textMuted }}>
          Loading offers…
        </div>
      )}

      {/* Tab content */}
      {!loading && (
        <>
          {activeTab === 'share'     && <ShareOfferTab bizName={bizName} isDark={isDark} offers={offers} />}
          {activeTab === 'instagram' && <InstagramTab  bizName={bizName} isDark={isDark} offers={offers} />}
        </>
      )}

      {/* Empty state */}
      {!loading && offers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: textMuted }}>
          <p>No offers yet. Create one in the <strong>Offers</strong> page to get started!</p>
        </div>
      )}
      {activeTab === 'scheduled' && <ScheduledTab  isDark={isDark} />}
    </div>
  );
}
