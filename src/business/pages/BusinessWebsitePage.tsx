import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { supabase } from '@/app/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BizData {
  id: string;
  name: string;
  logo?: string;
  category?: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  business_id?: string;
  owner_phone?: string;
  owner_email?: string;
}

interface Product {
  id: string;
  name: string;
  price?: number;
  image_url?: string;
  description?: string;
  status?: string;
}

interface Offer {
  id: string;
  title: string;
  description?: string;
  discount_pct?: number;
  valid_until?: string;
  status?: string;
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d0d18', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '4px solid #f97316', borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading business...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Not Found ─────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d0d18', gap: 16, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>🔍</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>Business Not Found</h1>
      <p style={{ fontSize: 15, color: '#64748b', maxWidth: 400, lineHeight: 1.6 }}>
        We couldn't find a business with this link. It may have been removed or the link is incorrect.
      </p>
      <a href="/" style={{ padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #fb923c)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
        Go Home
      </a>
    </div>
  );
}

// ── Offer Card ────────────────────────────────────────────────────────────────

function OfferCard({ offer, accent }: { offer: Offer; accent: string }) {
  const validUntil = offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  return (
    <div style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transition: 'transform 0.2s', position: 'relative' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
    >
      {/* Discount badge */}
      {offer.discount_pct && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 13, fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>
          {offer.discount_pct}% OFF
        </div>
      )}
      <div style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#18100a', marginBottom: 6 }}>{offer.title}</h3>
        {offer.description && <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 10 }}>{offer.description}</p>}
        {validUntil && (
          <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
            🗓️ Valid until {validUntil}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product, accent, onOrder }: { product: Product; accent: string; onOrder: () => void }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
    >
      {/* Image or placeholder */}
      <div style={{ height: 160, background: `linear-gradient(135deg, ${accent}22, #fb923c22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 48 }}>🛍️</span>
        }
      </div>
      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#18100a', margin: 0 }}>{product.name}</h3>
        {product.description && <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, margin: 0, flex: 1 }}>{product.description}</p>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          {product.price != null && (
            <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>₹{product.price.toLocaleString('en-IN')}</div>
          )}
          <button
            onClick={onOrder}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Order via App
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function BusinessWebsitePage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [bizData, setBizData] = useState<BizData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const accent = '#f97316';

  useEffect(() => {
    if (!businessId || !supabase) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Try biz_users table first
        const { data: bizUsers } = await supabase!
          .from('biz_users')
          .select('*')
          .eq('business_id', businessId)
          .single();

        // Also try businesses table
        const { data: businesses } = await supabase!
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();

        const combined: BizData | null = bizUsers
          ? {
              id: bizUsers.id ?? businessId!,
              name: bizUsers.business_name ?? bizUsers.name ?? businesses?.name ?? 'Business',
              logo: bizUsers.business_logo ?? bizUsers.logo ?? '🏪',
              category: bizUsers.business_category ?? bizUsers.category ?? businesses?.category,
              description: bizUsers.business_description ?? bizUsers.description ?? businesses?.description,
              address: bizUsers.address ?? businesses?.address,
              city: bizUsers.city ?? businesses?.city,
              phone: bizUsers.phone ?? bizUsers.owner_phone ?? businesses?.owner_phone,
              email: bizUsers.email ?? bizUsers.owner_email ?? businesses?.owner_email,
              website: bizUsers.website,
              business_id: businessId,
            }
          : businesses
            ? {
                id: businesses.id ?? businessId!,
                name: businesses.name ?? 'Business',
                logo: businesses.logo ?? '🏪',
                category: businesses.category,
                description: businesses.description,
                address: businesses.address,
                city: businesses.city,
                phone: businesses.owner_phone,
                email: businesses.owner_email,
                business_id: businessId,
              }
            : null;

        if (!combined) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setBizData(combined);

        // Fetch products
        const { data: prods } = await supabase!
          .from('products')
          .select('*')
          .eq('business_id', businessId)
          .eq('status', 'active')
          .limit(12);

        if (prods) setProducts(prods as Product[]);

        // Fetch offers
        const { data: offs } = await supabase!
          .from('offers')
          .select('*')
          .eq('business_id', businessId)
          .eq('status', 'active')
          .limit(6);

        if (offs) setOffers(offs as Offer[]);
      } catch (err) {
        console.error('[BusinessWebsitePage] fetch error', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [businessId]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  if (loading) return <Spinner />;
  if (notFound || !bizData) return <NotFound />;

  const tagline = bizData.description || `Your trusted ${bizData.category || 'business'} partner in ${bizData.city || 'your city'}`;
  const mapsUrl = bizData.address
    ? `https://www.google.com/maps/search/${encodeURIComponent([bizData.name, bizData.address, bizData.city].filter(Boolean).join(', '))}`
    : null;

  const sectionStyle = (bg: string): React.CSSProperties => ({
    background: bg,
    padding: '64px 24px',
  });

  const containerStyle: React.CSSProperties = {
    maxWidth: 1100,
    margin: '0 auto',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 800,
    color: '#18100a',
    marginBottom: 8,
    textAlign: 'center',
  };

  const sectionSubStyle: React.CSSProperties = {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 1.6,
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#18100a', color: '#fff', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          {toastMsg}
        </div>
      )}

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #0d0d18 0%, #1a1030 50%, #0d1a30 100%)', padding: '80px 24px 100px', position: 'relative', overflow: 'hidden' }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: `${accent}0d`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: '#3b82f60d', pointerEvents: 'none' }} />

        <div style={{ ...containerStyle, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ width: 100, height: 100, borderRadius: 24, background: `linear-gradient(135deg, ${accent}55, #fb923c55)`, border: `2px solid ${accent}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, margin: '0 auto 24px', boxShadow: `0 20px 60px ${accent}33` }}>
            {bizData.logo || '🏪'}
          </div>

          {/* Name & Category */}
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.2 }}>
            {bizData.name}
          </h1>
          {bizData.category && (
            <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 20, background: `${accent}33`, border: `1px solid ${accent}55`, color: accent, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
              {bizData.category}
            </div>
          )}

          {/* Tagline */}
          <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: '#94a3b8', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.6 }}>
            {tagline}
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {bizData.phone && (
              <a href={`tel:${bizData.phone}`} style={{ padding: '14px 28px', borderRadius: 12, background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 8px 30px ${accent}44` }}>
                📞 Contact Us
              </a>
            )}
            <a href="#offers" style={{ padding: '14px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#f1f5f9', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)' }}>
              🛍️ View Offers
            </a>
          </div>
        </div>
      </section>

      {/* ── About Section ────────────────────────────────────────────────────── */}
      {(bizData.description || bizData.address || bizData.phone) && (
        <section style={sectionStyle('#ffffff')}>
          <div style={containerStyle}>
            <h2 style={sectionTitleStyle}>About Us</h2>
            <p style={sectionSubStyle}>{tagline}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginTop: 32 }}>
              {bizData.address && (
                <div style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 28 }}>📍</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#18100a' }}>Our Location</div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                    {[bizData.address, bizData.city].filter(Boolean).join(', ')}
                  </div>
                </div>
              )}
              {bizData.phone && (
                <div style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 28 }}>📞</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#18100a' }}>Call Us</div>
                  <a href={`tel:${bizData.phone}`} style={{ fontSize: 13, color: accent, textDecoration: 'none', fontWeight: 600 }}>{bizData.phone}</a>
                </div>
              )}
              {bizData.email && (
                <div style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 28 }}>✉️</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#18100a' }}>Email Us</div>
                  <a href={`mailto:${bizData.email}`} style={{ fontSize: 13, color: accent, textDecoration: 'none', fontWeight: 600, wordBreak: 'break-all' }}>{bizData.email}</a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Offers Section ───────────────────────────────────────────────────── */}
      {offers.length > 0 && (
        <section id="offers" style={sectionStyle('#fef9f6')}>
          <div style={containerStyle}>
            <h2 style={sectionTitleStyle}>🎁 Current Offers</h2>
            <p style={sectionSubStyle}>Exclusive deals and discounts just for you</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {offers.map(offer => (
                <OfferCard key={offer.id} offer={offer} accent={accent} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Products Section ─────────────────────────────────────────────────── */}
      {products.length > 0 && (
        <section style={sectionStyle('#ffffff')}>
          <div style={containerStyle}>
            <h2 style={sectionTitleStyle}>🛍️ Our Products</h2>
            <p style={sectionSubStyle}>Browse our selection of quality products</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  accent={accent}
                  onOrder={() => showToast('📱 Please download the Redeem Rocket app to order')}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Location Section ─────────────────────────────────────────────────── */}
      {bizData.address && (
        <section style={sectionStyle('#f0fdf4')}>
          <div style={containerStyle}>
            <h2 style={sectionTitleStyle}>📍 Find Us</h2>
            <p style={sectionSubStyle}>{[bizData.address, bizData.city].filter(Boolean).join(', ')}</p>
            {mapsUrl && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 30px rgba(34,197,94,0.35)' }}
                >
                  🗺️ Get Directions
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Contact Section ──────────────────────────────────────────────────── */}
      <section style={sectionStyle('#ffffff')}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>📬 Get in Touch</h2>
          <p style={sectionSubStyle}>We'd love to hear from you!</p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {bizData.phone && (
              <a href={`tel:${bizData.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                📞 {bizData.phone}
              </a>
            )}
            {bizData.email && (
              <a href={`mailto:${bizData.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: '#1e293b', color: '#f1f5f9', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                ✉️ {bizData.email}
              </a>
            )}
            {bizData.website && (
              <a href={bizData.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#18100a', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                🌐 Visit Website
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0d0d18', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>🚀</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>Powered by</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: accent }}>Redeem Rocket</span>
        </div>
        <div style={{ fontSize: 12, color: '#475569' }}>
          {bizData.name} · All rights reserved
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
        @media (max-width: 640px) {
          section { padding: 40px 16px !important; }
        }
      `}</style>
    </div>
  );
}
