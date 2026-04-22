import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate }  from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useRBAC } from '../context/RBACContext';
import { useViewport } from '../hooks/useViewport';
import { getBusinessTypeKey } from '@/app/utils/businessType';
import { registerBusiness } from '@/app/api/supabase-data';
import { hasSupabase, supabase } from '@/app/lib/supabase';
import { MapPreviewCard } from './MapPreviewCard';
import { Save, Check, MapPin, Phone, Mail, Globe, Clock, Store, RefreshCw, ChevronDown, ChevronUp, Map } from 'lucide-react';
import { toast } from 'sonner';

// ── Map tile constants ──────────────────────────────────────────────────────
const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR  = '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>';

const PIN_COLORS: Record<string, string> = {
  restaurant: '#f97316', grocery: '#16a34a', pharmacy: '#2563eb',
  salon: '#db2777', hotel: '#7c3aed', atm: '#ca8a04', other: '#475569',
};

function makePinSvg(color: string, emoji: string): string {
  return `<div style="position:relative;width:36px;height:48px">
    <svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg"
      style="filter:drop-shadow(0 6px 10px rgba(0,0,0,0.40)) drop-shadow(0 2px 4px rgba(0,0,0,0.26));overflow:visible;display:block">
      <ellipse cx="18" cy="47.5" rx="5" ry="2" fill="rgba(0,0,0,0.16)"/>
      <path d="M18 2C9 2 2 9 2 18C2 30.5 18 46 18 46C18 46 34 30.5 34 18C34 9 27 2 18 2Z"
        fill="${color}" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="18" cy="17" r="11.5" fill="rgba(255,255,255,0.93)"/>
      <circle cx="14" cy="13" r="3" fill="rgba(255,255,255,0.45)"/>
    </svg>
    <span style="position:absolute;top:8px;left:50%;transform:translateX(-50%);font-size:14px;line-height:1;pointer-events:none">${emoji}</span>
  </div>`;
}

function seedCoords(seed: string): { lat: number; lng: number } {
  let h = 0;
  for (const c of seed) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  const n = (h >>> 0) / 4_294_967_295;
  return { lat: 19.04 + n * 0.18, lng: 72.82 + (n * 13) % 0.2 };
}

async function geocodeOrSeed(pincode: string, seed: string): Promise<{ lat: number; lng: number }> {
  if (pincode.length === 6) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=IN&format=json&limit=1`, { headers: { 'User-Agent': 'RedeemRocket/1.0' } });
      const data = await res.json();
      if (Array.isArray(data) && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch { /* fall through */ }
  }
  return seedCoords(seed);
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BUSINESS_CATEGORIES = [
  'Grocery', 'Restaurant', 'Electronics', 'Fashion', 'Pharmacy',
  'Beauty & Salon', 'Fitness', 'Education', 'Hotel', 'Auto', 'Gifts', 'Healthcare', 'Other'
];

export function BusinessProfilePage() {
  const { bizUser, setBizUser } = useBusinessContext();
  const navigate = useNavigate();
  const { isOwner } = useRBAC();
  const { isDark } = useTheme();
  const { isMobile } = useViewport();

  const [searchParams] = useSearchParams();
  const highlightIncomplete = searchParams.get('highlight') === 'incomplete';
  const highlightField = searchParams.get('field');

  // Refs for scrolling to incomplete fields
  const nameRef     = useRef<HTMLDivElement>(null);
  const phoneRef    = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const addressRef  = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    businessName: bizUser?.businessName ?? '',
    businessCategory: bizUser?.businessCategory ?? '',
    businessLogo: bizUser?.businessLogo ?? '🏪',
    ownerName: bizUser?.name ?? '',
    phone: '+91 98765 43210',
    email: bizUser?.email ?? '',
    website: '',
    address: '42, Gandhi Nagar, Sector 12',
    city: 'Mumbai',
    pincode: '400001',
    description: 'Your one-stop destination for premium quality organic grocery and daily essentials.',
  });

  const [hours, setHours] = useState(
    DAYS.map((day, i) => ({ day, open: '09:00', close: '21:00', closed: i === 6 }))
  );

  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'contact' | 'hours' | 'mappreview'>('basic');
  const [platformSelection, setPlatformSelection] = useState<'rr' | 'lms' | 'both'>(
    (bizUser?.product_selection as 'rr' | 'lms' | 'both') ?? 'both'
  );
  const [platformSaving, setPlatformSaving] = useState(false);
  const [platformSaved, setPlatformSaved] = useState(false);

  // ── Map Preview state ─────────────────────────────────────────────────────
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef  = useRef<L.Map | null>(null);
  const markerRef       = useRef<L.Marker | null>(null);

  const [mapEditOpen, setMapEditOpen] = useState(false);
  const [mapForm, setMapForm] = useState({
    name:     bizUser?.businessName ?? '',
    logo:     bizUser?.businessLogo ?? '🏪',
    category: bizUser?.businessCategory ?? '',
    address:  '42, Gandhi Nagar, Sector 12',
    pincode:  '400001',
  });
  const [mapSaving,    setMapSaving]    = useState(false);
  const [mapSaved,     setMapSaved]     = useState(false);
  const [mapToast,     setMapToast]     = useState('');
  const [autoGeocoding, setAutoGeocoding] = useState(false);

  const storedCoords = useMemo(() => {
    if (!bizUser?.businessId) return null;
    try {
      const raw = localStorage.getItem(`geo:biz:coords:${bizUser.businessId}`);
      return raw ? (JSON.parse(raw) as { lat: number; lng: number }) : null;
    } catch { return null; }
  }, [bizUser?.businessId]);

  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(storedCoords);

  // ── Highlight incomplete fields on mount when redirected from dashboard ───
  useEffect(() => {
    if (!highlightIncomplete) return;

    toast('📝 Please complete your profile to get the most out of Redeem Rocket');

    // Scroll to the correct field or first empty field
    setTimeout(() => {
      const fieldMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
        name: nameRef,
        phone: phoneRef,
        category: categoryRef,
        address: addressRef,
      };
      if (highlightField && fieldMap[highlightField]?.current) {
        fieldMap[highlightField].current!.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      // Scroll to first empty field
      const checks = [
        { empty: !form.businessName.trim(), ref: nameRef },
        { empty: !form.phone.trim(), ref: phoneRef },
        { empty: !form.businessCategory.trim(), ref: categoryRef },
        { empty: !form.address.trim(), ref: addressRef },
      ];
      const first = checks.find(c => c.empty);
      if (first?.ref.current) {
        first.ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightIncomplete, highlightField]);

  // ── Auto-geocode when entering map tab with no saved coords ───────────────
  useEffect(() => {
    if (activeSection !== 'mappreview') return;
    if (liveCoords) return;
    if (!bizUser?.businessId) return;
    setAutoGeocoding(true);
    geocodeOrSeed(mapForm.pincode || form.pincode || '400001', bizUser.businessId).then(coords => {
      localStorage.setItem(`geo:biz:coords:${bizUser.businessId}`, JSON.stringify(coords));
      setLiveCoords(coords);
      setAutoGeocoding(false);
    });
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Leaflet init — runs whenever tab active + coords ready ────────────────
  useEffect(() => {
    if (activeSection !== 'mappreview') return;
    if (!liveCoords || !mapContainerRef.current) return;

    // Destroy previous instance
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    markerRef.current = null;

    const { lat, lng } = liveCoords;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
    }).setView([lat, lng], 15);

    // Add zoom control (top-right so it doesn't overlap the header)
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer(isDark ? TILE_DARK : TILE_LIGHT, { subdomains: 'abcd', maxZoom: 20, attribution: TILE_ATTR }).addTo(map);

    // Force Leaflet to measure the container after CSS paint
    setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize(); }, 100);

    const typeKey  = getBusinessTypeKey(mapForm.category || mapForm.name);
    const pinColor = PIN_COLORS[typeKey] ?? '#475569';

    const marker = L.marker([lat, lng], {
      icon: L.divIcon({ html: makePinSvg(pinColor, mapForm.logo || '🏪'), className: '', iconSize: [36, 48], iconAnchor: [18, 48] }),
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;

    // ── Drag-end: save new position to localStorage + Supabase ──────────────
    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      const newCoords = { lat: pos.lat, lng: pos.lng };
      setLiveCoords(newCoords);
      if (bizUser?.businessId) {
        localStorage.setItem(`geo:biz:coords:${bizUser.businessId}`, JSON.stringify(newCoords));
      }
      setMapToast('Saving location...');
      try {
        const ok = await registerBusiness({
          id: bizUser!.businessId,
          name:     mapForm.name     || bizUser!.businessName,
          logo:     mapForm.logo     || bizUser!.businessLogo,
          category: mapForm.category || bizUser!.businessCategory,
          address:  mapForm.address,
          lat:      pos.lat,
          lng:      pos.lng,
          plan:     bizUser!.plan,
        });
        const msg = ok
          ? `📍 Location saved — ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`
          : `📍 Saved locally — ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
        setMapToast(msg);
      } catch {
        setMapToast('Saved locally. Sync failed — check connection.');
      }
      setMapSaved(true);
      setTimeout(() => { setMapToast(''); setMapSaved(false); }, 4000);
    });

    mapInstanceRef.current = map;

    return () => {
      markerRef.current = null;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [activeSection, liveCoords, isDark]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Styling ───────────────────────────────────────────────────────────────
  const card      = isDark ? '#0e1530' : '#ffffff';
  const border    = isDark ? '#1c2a55' : '#e8d8cc';
  const text      = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg   = isDark ? '#162040' : '#fdf6f0';
  const accent    = '#f97316';

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1.5px solid ${border}`, background: inputBg,
    color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  };

  function saveProfile() {
    if (bizUser) {
      setBizUser({
        ...bizUser,
        name: form.ownerName,
        businessName: form.businessName,
        businessLogo: form.businessLogo,
        businessCategory: form.businessCategory,
        email: form.email,
      });
    }
    // Persist owner_phone + owner_email to Supabase for notification delivery
    if (supabase && bizUser?.businessId) {
      supabase.from('businesses').update({
        owner_phone: form.phone || null,
        owner_email: form.email || null,
      }).eq('id', bizUser.businessId).then(({ error }) => {
        if (error) console.warn('[profile] owner contact save error', error.message);
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleHours(idx: number) {
    setHours(h => h.map((d, i) => i === idx ? { ...d, closed: !d.closed } : d));
  }

  async function handleMapSave() {
    if (!bizUser?.businessId) return;
    setMapSaving(true);
    try {
      const coords = await geocodeOrSeed(mapForm.pincode, bizUser.businessId);
      localStorage.setItem(`geo:biz:coords:${bizUser.businessId}`, JSON.stringify(coords));
      setLiveCoords(coords);
      const fullAddress = [mapForm.address, mapForm.pincode].filter(Boolean).join(', ');
      await registerBusiness({ id: bizUser.businessId, name: mapForm.name, logo: mapForm.logo, category: mapForm.category, address: fullAddress, lat: coords.lat, lng: coords.lng, plan: bizUser.plan });
      setBizUser({ ...bizUser, businessName: mapForm.name, businessLogo: mapForm.logo, businessCategory: mapForm.category });
      setMapToast(hasSupabase() ? 'Map updated successfully ✓' : 'Location updated locally. Connect Supabase to sync to the customer map.');
      setMapSaved(true);
      setTimeout(() => { setMapSaved(false); setMapToast(''); }, 3500);
    } catch {
      setMapToast('Failed to update. Please try again.');
    }
    setMapSaving(false);
  }

  async function handlePlatformSave() {
    if (!bizUser?.businessId) return;
    setPlatformSaving(true);
    try {
      if (supabase) {
        await supabase
          .from('businesses')
          .update({ product_selection: platformSelection })
          .eq('id', bizUser.businessId);
      }
      setBizUser({ ...bizUser, product_selection: platformSelection });
      setPlatformSaved(true);
      setTimeout(() => setPlatformSaved(false), 2500);
    } catch (e) {
      console.warn('[profile] platform save error', e);
    }
    setPlatformSaving(false);
  }

  const TABS = [
    { id: 'basic',      label: isMobile ? 'Info'    : 'Business Info',      icon: <Store   size={15} /> },
    { id: 'contact',    label: isMobile ? 'Contact' : 'Contact & Location', icon: <MapPin  size={15} /> },
    { id: 'hours',      label: isMobile ? 'Hours'   : 'Opening Hours',      icon: <Clock   size={15} /> },
    { id: 'mappreview', label: isMobile ? 'Map'     : 'Map Preview',        icon: <Map     size={15} /> },
  ] as const;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: text, marginBottom: 2 }}>Business Profile</h1>
          <p style={{ fontSize: 13, color: textMuted }}>Manage your business information and settings</p>
        </div>
        <button onClick={saveProfile} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: saved ? '#22c55e' : `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s' }}>
          {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
        </button>
      </div>

      {/* Profile header */}
      <div style={{ background: `linear-gradient(135deg, ${accent}22, #fb923c22)`, borderRadius: 20, border: `1px solid ${accent}44`, padding: isMobile ? 16 : 24, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: `linear-gradient(135deg, ${accent}55, #fb923c55)`, border: `2px solid ${accent}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => {
            const emojis = ['🏪', '🛒', '🍛', '💊', '👗', '🔌', '💈', '🏋️', '🎁', '🏥'];
            const current = emojis.indexOf(form.businessLogo);
            setForm(f => ({ ...f, businessLogo: emojis[(current + 1) % emojis.length] }));
          }}>
          {form.businessLogo}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.businessName || 'Your Business'}</h2>
          <p style={{ fontSize: 13, color: textMuted, marginBottom: 6 }}>{form.businessCategory || 'Category not set'}</p>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, flexWrap: 'wrap' }}>
            <span style={{ color: textMuted }}><MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{form.city || 'City not set'}</span>
            <span style={{ color: textMuted }}><Phone size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{form.phone}</span>
          </div>
        </div>
        <div style={{ padding: '8px 16px', borderRadius: 20, background: `${accent}33`, border: `1px solid ${accent}55`, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>
            {bizUser?.plan ? bizUser.plan.charAt(0).toUpperCase() + bizUser.plan.slice(1) + ' Plan' : 'Free Plan'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: isDark ? '#0f0f1e' : '#f3f4f6', borderRadius: 12, padding: 4 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: isMobile ? 0 : 8,
              flexDirection: isMobile ? 'column' : 'row',
              padding: isMobile ? '8px 4px' : '10px',
              borderRadius: 8, border: 'none',
              background: activeSection === tab.id ? card : 'transparent',
              color: activeSection === tab.id ? text : textMuted,
              cursor: 'pointer',
              fontSize: isMobile ? 10 : 13,
              fontWeight: activeSection === tab.id ? 700 : 400,
              boxShadow: activeSection === tab.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon}
            {isMobile ? <span style={{ marginTop: 2 }}>{tab.label}</span> : tab.label}
          </button>
        ))}
      </div>

      {/* Basic Info */}
      {activeSection === 'basic' && (
        <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>Business Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div ref={nameRef}>
              <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Business Name</label>
              <input
                value={form.businessName}
                onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                style={{ ...inputStyle, ...(highlightIncomplete && !form.businessName.trim() ? { border: '2px solid #ef4444' } : {}) }}
              />
              {highlightIncomplete && !form.businessName.trim() && (
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>⚠️ This field is required</div>
              )}
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Owner/Manager Name</label>
              <input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div ref={categoryRef}>
            <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Business Category</label>
            <select
              value={form.businessCategory}
              onChange={e => setForm(f => ({ ...f, businessCategory: e.target.value }))}
              style={{ ...inputStyle, ...(highlightIncomplete && !form.businessCategory.trim() ? { border: '2px solid #ef4444' } : {}) }}
            >
              {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {highlightIncomplete && !form.businessCategory.trim() && (
              <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>⚠️ This field is required</div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Business Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Logo Emoji (click to cycle)</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['🏪', '🛒', '🍛', '💊', '👗', '🔌', '💈', '🏋️', '🎁', '🏥', '🌿', '🍵'].map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, businessLogo: e }))} style={{ width: 44, height: 44, borderRadius: 10, border: `2px solid ${form.businessLogo === e ? accent : border}`, background: form.businessLogo === e ? `${accent}22` : inputBg, cursor: 'pointer', fontSize: 24 }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact & Location */}
      {activeSection === 'contact' && (
        <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>Contact & Location</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div ref={phoneRef}>
              <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}><Phone size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Phone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                style={{ ...inputStyle, ...(highlightIncomplete && !form.phone.trim() ? { border: '2px solid #ef4444' } : {}) }}
              />
              {highlightIncomplete && !form.phone.trim() && (
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>⚠️ This field is required</div>
              )}
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}><Mail size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}><Globe size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Website</label>
            <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://yourbusiness.com" style={inputStyle} />
          </div>
          <div ref={addressRef}>
            <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Street Address</label>
            <input
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              style={{ ...inputStyle, ...(highlightIncomplete && !form.address.trim() ? { border: '2px solid #ef4444' } : {}) }}
            />
            {highlightIncomplete && !form.address.trim() && (
              <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>⚠️ This field is required</div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>City</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Pincode</label>
              <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} style={inputStyle} />
            </div>
          </div>
        </div>
      )}

      {/* Hours */}
      {activeSection === 'hours' && (
        <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 16 }}>Opening Hours</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hours.map((h, i) => {
              const isToday = new Date().getDay() === (i + 1) % 7;
              return (
                <div key={h.day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isToday ? `${accent}11` : isDark ? '#0f1838' : '#fdf6f0', borderRadius: 10, border: `1px solid ${isToday ? accent + '44' : border}`, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <div style={{ width: isMobile ? '100%' : 90, fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? accent : text }}>{h.day}{isToday ? ' (Today)' : ''}</div>
                  {h.closed ? (
                    <div style={{ flex: 1, fontSize: 13, color: textMuted }}>Closed</div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="time" value={h.open} onChange={e => setHours(hs => hs.map((d, j) => j === i ? { ...d, open: e.target.value } : d))}
                        style={{ background: inputBg, border: `1px solid ${border}`, borderRadius: 6, color: text, padding: '5px 8px', fontSize: 12 }} />
                      <span style={{ color: textMuted, fontSize: 12 }}>-</span>
                      <input type="time" value={h.close} onChange={e => setHours(hs => hs.map((d, j) => j === i ? { ...d, close: e.target.value } : d))}
                        style={{ background: inputBg, border: `1px solid ${border}`, borderRadius: 6, color: text, padding: '5px 8px', fontSize: 12 }} />
                    </div>
                  )}
                  <button onClick={() => toggleHours(i)} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${h.closed ? '#22c55e44' : '#ef444444'}`, background: 'transparent', cursor: 'pointer', color: h.closed ? '#22c55e' : '#ef4444', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {h.closed ? 'Set Open' : 'Close Day'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Preview */}
      {activeSection === 'mappreview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Banner */}
          <div style={{ padding: '12px 16px', borderRadius: 12, background: `${accent}11`, border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Map size={18} color={accent} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: text }}>Map Preview</div>
              <div style={{ fontSize: 11, color: textMuted }}>See exactly how customers find you · Drag the pin to set your precise location</div>
            </div>
          </div>

          {/* Map + Preview Card — always rendered */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 20, alignItems: 'start' }}>
            {/* Left: Leaflet map */}
            <div style={{ borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, background: card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: text }}>Your location on the map</span>
                {autoGeocoding && (
                  <span style={{ fontSize: 11, color: textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Locating…
                  </span>
                )}
              </div>

              {/* Map container — always in DOM so ref is always set */}
              <div style={{ position: 'relative' }}>
                <div
                  ref={mapContainerRef}
                  style={{ height: 340, width: '100%', background: isDark ? '#162040' : '#e8d8cc' }}
                />
                {/* Loading overlay when no coords yet */}
                {!liveCoords && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: isDark ? 'rgba(18,18,31,0.85)' : 'rgba(243,244,246,0.85)',
                    backdropFilter: 'blur(4px)', zIndex: 10,
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 4 }}>
                      {autoGeocoding ? 'Finding your location…' : 'Location Not Set'}
                    </div>
                    <div style={{ fontSize: 11, color: textMuted, textAlign: 'center', maxWidth: 200 }}>
                      {autoGeocoding ? 'Geocoding your pincode' : 'Use the form below to set your location'}
                    </div>
                  </div>
                )}
              </div>

              {/* Live coordinate bar */}
              <div style={{ padding: '8px 14px', borderTop: `1px solid ${border}`, background: card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, minHeight: 36 }}>
                {liveCoords ? (
                  <>
                    <span style={{ fontSize: 11, color: accent, fontFamily: 'monospace', fontWeight: 600 }}>
                      {liveCoords.lat.toFixed(6)}, {liveCoords.lng.toFixed(6)}
                    </span>
                    <span style={{ fontSize: 11, color: textMuted }}>Drag pin to reposition</span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: textMuted }}>Coordinates will appear after location is set</span>
                )}
              </div>

              {/* Drag toast */}
              {mapToast && (
                <div style={{ padding: '10px 14px', background: mapSaved ? '#22c55e22' : '#3b82f622', borderTop: `1px solid ${mapSaved ? '#22c55e44' : '#3b82f644'}`, color: mapSaved ? '#22c55e' : '#60a5fa', fontSize: 12, fontWeight: 500 }}>
                  {mapToast}
                </div>
              )}
            </div>

            {/* Right: Customer popup preview */}
            <div>
              <MapPreviewCard
                name={mapForm.name || bizUser?.businessName || ''}
                logo={mapForm.logo || bizUser?.businessLogo || '🏪'}
                category={mapForm.category || bizUser?.businessCategory || ''}
                address={mapForm.address + (mapForm.pincode ? ', ' + mapForm.pincode : '')}
                isDark={isDark}
                offerCount={0}
              />
            </div>
          </div>

          {/* Edit Map Info (collapsible) */}
          <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden' }}>
            <button
              onClick={() => setMapEditOpen(o => !o)}
              style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', color: text, fontSize: 13, fontWeight: 600 }}
            >
              <span>Edit Map Info</span>
              {mapEditOpen ? <ChevronUp size={16} color={textMuted} /> : <ChevronDown size={16} color={textMuted} />}
            </button>

            {mapEditOpen && (
              <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ height: 16 }} />
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Business Name</label>
                    <input value={mapForm.name} onChange={e => setMapForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Logo Emoji</label>
                    <input value={mapForm.logo} onChange={e => setMapForm(f => ({ ...f, logo: e.target.value }))} style={{ ...inputStyle, fontSize: 22, textAlign: 'center' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Category</label>
                  <select value={mapForm.category} onChange={e => setMapForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                    {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Street Address</label>
                  <input value={mapForm.address} onChange={e => setMapForm(f => ({ ...f, address: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Pincode</label>
                  <input value={mapForm.pincode} onChange={e => setMapForm(f => ({ ...f, pincode: e.target.value }))} placeholder="e.g. 400001" maxLength={6} style={inputStyle} />
                </div>

                <button
                  onClick={handleMapSave}
                  disabled={mapSaving}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 10, border: 'none',
                    background: mapSaved ? '#22c55e' : `linear-gradient(135deg, ${accent}, #fb923c)`,
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: mapSaving ? 'not-allowed' : 'pointer',
                    opacity: mapSaving ? 0.7 : 1,
                  }}
                >
                  <RefreshCw size={14} />
                  {mapSaving ? 'Geocoding & Saving...' : mapSaved ? 'Map Updated!' : 'Re-geocode & Save'}
                </button>

                <p style={{ fontSize: 11, color: textMuted, textAlign: 'center' }}>
                  Geocodes your pincode and moves the pin — or drag the pin directly on the map for precise positioning
                </p>
              </div>
            )}
          </div>

          {/* Inline spinner keyframe */}
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Platform Access — owner-only: team members cannot change RR/LMS selection */}
      {!isOwner && (
        <div style={{ background: isDark ? '#0e1530' : '#fff', borderRadius: 16, border: `1px solid ${border}`, padding: 20, marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f97316', marginBottom: 2 }}>Platform Access — Owner Only</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Only the business owner can change the active platform (Redeem Rocket / LMS).
              Currently active: <strong style={{ color: '#f97316' }}>{bizUser?.product_selection === 'rr' ? 'Redeem Rocket' : bizUser?.product_selection === 'lms' ? 'LMS' : 'Both'}</strong>
            </div>
          </div>
        </div>
      )}
      {isOwner && (
      <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 24, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 2 }}>Platform Access</h3>
            <p style={{ fontSize: 12, color: textMuted }}>Choose which platform modules are active for your business</p>
          </div>
          <button
            onClick={handlePlatformSave}
            disabled={platformSaving}
            style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              background: platformSaved ? '#22c55e' : `linear-gradient(135deg, ${accent}, #fb923c)`,
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: platformSaving ? 'not-allowed' : 'pointer',
              opacity: platformSaving ? 0.7 : 1,
            }}
          >
            {platformSaved ? '✓ Saved!' : platformSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
          {([
            { value: 'rr' as const,   label: 'Redeem Rocket', desc: 'Orders, Offers, Products, Wallet & Auctions', emoji: '🚀' },
            { value: 'lms' as const,  label: 'LMS',           desc: 'Leads, CRM, Campaigns, Analytics & Outreach', emoji: '🎯' },
            { value: 'both' as const, label: 'Both',           desc: 'Full access to all features and modules',    emoji: '⭐' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setPlatformSelection(opt.value)}
              style={{
                padding: '16px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                border: `2px solid ${platformSelection === opt.value ? accent : border}`,
                background: platformSelection === opt.value ? `${accent}14` : inputBg,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: platformSelection === opt.value ? accent : text, marginBottom: 4 }}>
                {opt.label}
              </div>
              <div style={{ fontSize: 11, color: textMuted, lineHeight: 1.5 }}>{opt.desc}</div>
              {platformSelection === opt.value && (
                <div style={{ marginTop: 8, display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: `${accent}33`, fontSize: 10, fontWeight: 700, color: accent }}>
                  ACTIVE
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Customize Features Section */}
      {isOwner && (
        <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 24, marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 2 }}>Customize Features</h3>
              <p style={{ fontSize: 12, color: textMuted }}>Re-run Smart Onboarding to select which features you want to use</p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 14,
          }}>
            <button
              onClick={() => {
                // Set onboarding status back to pending and navigate to onboarding
                setBizUser({
                  ...bizUser!,
                  onboarding_done: false,
                });
                localStorage.setItem('biz_user', JSON.stringify({
                  ...bizUser!,
                  onboarding_done: false,
                }));
                navigate('/business/onboarding');
              }}
              style={{
                padding: '16px 14px',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                border: `1.5px solid ${border}`,
                background: inputBg,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = isDark ? '#1f3a5f22' : '#e0e7ff22';
                (e.currentTarget as HTMLElement).style.borderColor = accent;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = inputBg;
                (e.currentTarget as HTMLElement).style.borderColor = border;
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: accent, marginBottom: 4 }}>
                Re-run Onboarding
              </div>
              <div style={{ fontSize: 11, color: textMuted, lineHeight: 1.5 }}>
                Select features again and customize your dashboard
              </div>
            </button>

            <div
              style={{
                padding: '16px 14px',
                borderRadius: 12,
                border: `1.5px solid ${border}`,
                background: inputBg,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 8 }}>
                Active Features
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { key: 'product_catalog', label: 'Product Catalog' },
                  { key: 'lead_management', label: 'Lead Management' },
                  { key: 'email_campaigns', label: 'Email Campaigns' },
                  { key: 'automation', label: 'Automation' },
                  { key: 'social_media', label: 'Social Media' },
                ].map(feature => (
                  <div
                    key={feature.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      color: (bizUser?.feature_preferences?.[feature.key as keyof typeof bizUser.feature_preferences] ?? true) ? accent : textMuted,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>
                      {(bizUser?.feature_preferences?.[feature.key as keyof typeof bizUser.feature_preferences] ?? true) ? '✓' : '○'}
                    </span>
                    {feature.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
