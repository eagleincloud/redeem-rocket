import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { LocationSelector } from './LocationSelector';
import { DocumentUploader } from './DocumentUploader';
import { ArrowRight, ArrowLeft, Check, MapPin, Clock, Image, CreditCard, Store, Users, FileText, Globe, Layers } from 'lucide-react';
import { registerBusiness, upsertBusinessHours, markScrapedBizClaimed } from '@/app/api/supabase-data';
import { supabase as _supabase, hasSupabase } from '@/app/lib/supabase';

const BUSINESS_TYPES = [
  { emoji: '🍛', label: 'Restaurant' },
  { emoji: '🛒', label: 'Grocery' },
  { emoji: '💊', label: 'Pharmacy' },
  { emoji: '👗', label: 'Fashion' },
  { emoji: '🔌', label: 'Electronics' },
  { emoji: '💈', label: 'Salon' },
  { emoji: '🏋️', label: 'Fitness' },
  { emoji: '📚', label: 'Education' },
  { emoji: '🏨', label: 'Hotel' },
  { emoji: '🚗', label: 'Auto' },
  { emoji: '🎁', label: 'Gifts' },
  { emoji: '🏥', label: 'Healthcare' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PLANS = [
  { id: 'free', name: 'Free', price: 0, color: '#6b7280', features: ['5 products', '2 active offers', 'Basic analytics'] },
  { id: 'basic', name: 'Basic', price: 499, color: '#3b82f6', features: ['50 products', '10 active offers', 'Full analytics', 'Priority listing'] },
  { id: 'pro', name: 'Pro', price: 999, color: '#fb923c', features: ['Unlimited products', 'Unlimited offers', 'Advanced analytics', 'Auction access', 'Featured badge'] },
  { id: 'enterprise', name: 'Enterprise', price: 2999, color: '#f59e0b', features: ['Everything in Pro', 'Dedicated manager', 'API access', 'Custom integrations', 'SLA guarantee'] },
];

const AREA_PRESETS: Record<string, string[]> = {
  'Bangalore': ['Indiranagar', 'Koramangala', 'Whitefield', 'MG Road', 'Jayanagar', 'Bellandur'],
  'Mumbai': ['Bandra', 'Andheri', 'Worli', 'Marine Drive', 'Juhu', 'Powai'],
  'Delhi': ['Connaught Place', 'Greater Kailash', 'Dwarka', 'Noida', 'Gurgaon'],
  'Chennai': ['T.Nagar', 'Adyar', 'Besant Nagar', 'Anna Nagar', 'Mylapore'],
};

export function BusinessOnboarding() {
  const { bizUser, setBizUser } = useBusinessContext();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 0: Business Description
  const [bizDescription, setBizDescription] = useState(bizUser?.businessDescription ?? '');

  // Step 1: Location
  const [locationData, setLocationData] = useState({
    lat: bizUser?.mapLat ?? 20.5937,
    lng: bizUser?.mapLng ?? 78.9629,
    address: '',
    city: '',
    pincode: '',
  });

  // Step 2: Service Coverage
  const [serviceRadius, setServiceRadius] = useState(bizUser?.serviceRadius ?? 5);
  const [selectedCity, setSelectedCity] = useState('Bangalore');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(bizUser?.serviceAreas ?? []);
  const [customAreas, setCustomAreas] = useState('');

  // Step 3: Hours
  const [hours, setHours] = useState(
    DAYS.map((day) => ({ day, open: '09:00', close: '21:00', closed: day === 'Sunday' }))
  );

  // Step 4: Photos
  const [photos, setPhotos] = useState<string[]>(['', '', '', '', '', '']);

  // Step 5: Documents
  const [documents, setDocuments] = useState<Record<string, string>>(bizUser?.documents ?? {});

  // Step 6: Website & Links
  const [website, setWebsite] = useState(bizUser?.businessWebsite ?? '');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    facebook: '',
    instagram: '',
    youtube: '',
    linkedin: '',
  });

  // Step 1: Product Selection
  const [productSelection, setProductSelection] = useState<'rr' | 'lms' | 'both'>('both');

  // Step 8: Team & Plan
  const [teamMembers, setTeamMembers] = useState([
    { name: '', email: '', role: 'staff' as const, password: '' }
  ]);
  const [plan, setPlan] = useState<'free' | 'basic' | 'pro' | 'enterprise'>('free');
  const [scrapedId, setScrapedId] = useState<string | null>(null);

  const [finishing, setFinishing] = useState(false);
  const [finishToast, setFinishToast] = useState('');

  const bg = isDark ? '#080d20' : '#faf7f3';
  const card = isDark ? '#0e1530' : '#ffffff';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg = isDark ? '#162040' : '#fdf6f0';
  const accent = '#f97316';

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: `1.5px solid ${border}`,
    background: inputBg,
    color: text,
    fontSize: 14,
    outline: 'none' as const,
    boxSizing: 'border-box' as const,
  };

  const STEPS = [
    { label: 'Description', icon: Store },
    { label: 'Product Selection', icon: Layers },
    { label: 'Location', icon: MapPin },
    { label: 'Service Area', icon: Globe },
    { label: 'Hours', icon: Clock },
    { label: 'Photos', icon: Image },
    { label: 'Documents', icon: FileText },
    { label: 'Website', icon: Globe },
    { label: 'Team & Plan', icon: Users },
  ];

  useEffect(() => {
    const hashSearch = window.location.hash.split('?')[1] ?? '';
    const params = new URLSearchParams(hashSearch);
    const raw = params.get('prefill');
    if (!raw) return;
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (data.address) {
        const parts = (data.address as string).split(',');
        setLocationData((prev) => ({
          ...prev,
          address: parts[0]?.trim() ?? '',
          city: parts[1]?.trim() ?? '',
          pincode: parts[2]?.trim().match(/^\d{6}$/) ? parts[2].trim() : '',
        }));
      }
      if (data.scraped_id) setScrapedId(data.scraped_id as string);
    } catch { /* ignore */ }
  }, []);

  const handleToggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleToggleHoursClosed = (idx: number) => {
    setHours((h) => h.map((d, i) => (i === idx ? { ...d, closed: !d.closed } : d)));
  };

  const handleUpdateHours = (idx: number, field: 'open' | 'close', val: string) => {
    setHours((h) => h.map((d, i) => (i === idx ? { ...d, [field]: val } : d)));
  };

  const handlePhotoChange = (idx: number, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newPhotos = [...photos];
      newPhotos[idx] = reader.result as string;
      setPhotos(newPhotos);
    };
    reader.readAsDataURL(file);
  };

  const finish = async () => {
    if (!bizUser || finishing) return;
    setFinishing(true);

    const planExpiry = plan === 'free'
      ? null
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const businessId = `biz-${Date.now()}`;
    const updatedUser = {
      ...bizUser,
      businessId,
      businessName: bizUser.businessName || 'My Business',
      businessLogo: BUSINESS_TYPES.find((t) => t.label === bizUser.businessCategory)?.emoji || '🏪',
      businessCategory: bizUser.businessCategory,
      businessDescription: bizDescription,
      businessWebsite: website,
      mapLat: locationData.lat,
      mapLng: locationData.lng,
      serviceRadius,
      serviceAreas: [...selectedAreas, ...customAreas.split(',').map((a) => a.trim()).filter(Boolean)],
      documents,
      plan,
      planExpiry,
      onboarding_done: true,
      product_selection: productSelection,
    };
    setBizUser(updatedUser);

    const fullAddress = [locationData.address, locationData.city, locationData.pincode]
      .filter(Boolean)
      .join(', ');

    const saved = await registerBusiness({
      id: businessId,
      name: updatedUser.businessName!,
      logo: updatedUser.businessLogo,
      category: bizUser.businessCategory,
      address: fullAddress,
      lat: locationData.lat,
      lng: locationData.lng,
      plan,
    });

    await upsertBusinessHours(businessId, hours);

    if (scrapedId) {
      await markScrapedBizClaimed(scrapedId);
    }

    if (!hasSupabase || !saved) {
      setFinishToast('Business created! Connect Supabase to appear on the customer map.');
      setTimeout(() => setFinishToast(''), 4000);
    }

    const hasTeam = teamMembers.some((m) => m.name.trim() || m.email.trim());
    localStorage.setItem(`gs_${businessId}`, JSON.stringify({
      updateProfile: false,
      addProduct: false,
      createOffer: false,
      addTeamMember: hasTeam,
      sendCampaign: false,
    }));

    const sb = _supabase;
    if (sb) {
      const validMembers = teamMembers.filter((m) => m.name.trim() && m.email.trim());
      if (validMembers.length > 0) {
        await sb.from('business_team_members').insert(
          validMembers.map((m) => ({
            business_id: businessId,
            name: m.name.trim(),
            email: m.email.trim(),
            role: m.role,
            password_hint: m.password ? '••••••' : null,
          }))
        );
      }
    }

    setFinishing(false);
    navigate('/app');
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, #0d0d18 0%, #1a0c28 40%, #0a1428 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 640, color: text }}>
        {scrapedId && (
          <div style={{ background: 'linear-gradient(135deg, #22c55e22, #16a34a18)', border: '1px solid #22c55e55', borderRadius: 14, padding: '12px 18px', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🎉</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>Your business listing is pre-filled!</div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Redeem Rocket" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 8 }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Complete Your Setup</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ width: i === step ? 28 : 10, height: 10, borderRadius: 5, background: i < step ? accent : i === step ? '#a5b4fc' : '#1c2a55', transition: 'all 0.3s' }} />
          ))}
        </div>

        <div style={{ background: card, borderRadius: 20, border: `1px solid ${border}`, padding: 32 }}>
          {/* Step 0: Business Description */}
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Tell us about your business</h2>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, display: 'block' }}>Business Description</label>
                <textarea
                  value={bizDescription}
                  onChange={(e) => setBizDescription(e.target.value)}
                  placeholder="What services do you offer? Tell customers about your business..."
                  style={{ ...inputStyle, height: 120, resize: 'none' } as React.CSSProperties}
                />
              </div>
              <button onClick={() => setStep(1)} style={{ width: '100%', padding: 12, background: accent, color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                Next: Product Selection
              </button>
            </div>
          )}

          {/* Step 1: Product Selection */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Choose your product</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Select the modules you want to activate for your business.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                {[
                  {
                    id: 'rr' as const,
                    title: 'Redeem Rocket (RR)',
                    icon: '🚀',
                    description: 'Orders, Products, Offers, Auctions, Invoices & Wallet',
                    color: '#f97316',
                  },
                  {
                    id: 'lms' as const,
                    title: 'LMS (Leads & CRM)',
                    icon: '🎯',
                    description: 'Leads, Requirements, Campaigns, Outreach & Analytics',
                    color: '#3b82f6',
                  },
                  {
                    id: 'both' as const,
                    title: 'Both — Full Access',
                    icon: '⚡',
                    description: 'Everything in Redeem Rocket + LMS combined',
                    color: '#22c55e',
                  },
                ].map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setProductSelection(option.id)}
                    style={{
                      padding: 20,
                      borderRadius: 14,
                      border: `2px solid ${productSelection === option.id ? option.color : border}`,
                      background: productSelection === option.id ? `${option.color}18` : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <div style={{ fontSize: 32, lineHeight: 1 }}>{option.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: productSelection === option.id ? option.color : text, marginBottom: 4 }}>{option.title}</div>
                      <div style={{ fontSize: 12, color: textMuted }}>{option.description}</div>
                    </div>
                    {productSelection === option.id && (
                      <Check style={{ width: 20, height: 20, color: option.color, flexShrink: 0 }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(0)} style={{ flex: 1, padding: 12, background: 'transparent', color: accent, border: `1.5px solid ${accent}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Back</button>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: 12, background: accent, color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Next: Location</button>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Where is your business?</h2>
              <LocationSelector
                onLocationSelected={(loc) => {
                  setLocationData(loc);
                  setStep(3);
                }}
                initialLat={locationData.lat}
                initialLng={locationData.lng}
                initialAddress={locationData.address}
              />
              <button onClick={() => setStep(1)} style={{ width: '100%', padding: 12, background: 'transparent', color: accent, border: `1.5px solid ${accent}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600, marginTop: 16 }}>
                Back
              </button>
            </div>
          )}

          {/* Step 3: Service Coverage */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>What's your service coverage?</h2>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, display: 'block' }}>Service Radius (km)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min="1" max="50" value={serviceRadius} onChange={(e) => setServiceRadius(Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: text, minWidth: 60 }}>{serviceRadius} km</span>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10, display: 'block' }}>Service Areas</label>
                <div style={{ marginBottom: 12 }}>
                  {Object.keys(AREA_PRESETS).map((city) => (
                    <div key={city} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#a5b4fc', marginBottom: 6 }}>{city}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {AREA_PRESETS[city].map((area) => (
                          <button
                            key={area}
                            onClick={() => handleToggleArea(area)}
                            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${selectedAreas.includes(area) ? accent : border}`, background: selectedAreas.includes(area) ? `${accent}22` : 'transparent', color: text, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                          >
                            {selectedAreas.includes(area) && <Check style={{ display: 'inline', marginRight: 4, width: 12, height: 12 }} />}
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <input type="text" placeholder="Add custom areas (comma-separated)" value={customAreas} onChange={(e) => setCustomAreas(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: 12, background: 'transparent', color: accent, border: `1.5px solid ${accent}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Back</button>
                <button onClick={() => setStep(4)} style={{ flex: 1, padding: 12, background: accent, color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Next</button>
              </div>
            </div>
          )}

          {/* Step 4: Hours */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Business Hours</h2>
              {hours.map((h, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 12, background: inputBg, borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: text, minWidth: 100 }}>{h.day}</label>
                    <input type="checkbox" checked={h.closed} onChange={() => handleToggleHoursClosed(i)} style={{ cursor: 'pointer' }} />
                    <span style={{ fontSize: 12, color: textMuted }}>Closed</span>
                  </div>
                  {!h.closed && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input type="time" value={h.open} onChange={(e) => handleUpdateHours(i, 'open', e.target.value)} style={{ ...inputStyle, flex: 1 } as React.CSSProperties} />
                      <input type="time" value={h.close} onChange={(e) => handleUpdateHours(i, 'close', e.target.value)} style={{ ...inputStyle, flex: 1 } as React.CSSProperties} />
                    </div>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: 12, background: 'transparent', color: accent, border: `1.5px solid ${accent}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Back</button>
                <button onClick={() => setStep(5)} style={{ flex: 1, padding: 12, background: accent, color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Next</button>
              </div>
            </div>
          )}

          {/* Step 5: Photos */}
          {step === 5 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Upload Photos</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {photos.map((photo, i) => (
                  <div key={i} style={{ position: 'relative', paddingBottom: '100%' }}>
                    <div style={{ position: 'absolute', inset: 0, background: inputBg, borderRadius: 10, border: `1.5px dashed ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoChange(i, e.target.files?.[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                      {photo ? <img src={photo} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', fontSize: 12, color: textMuted }}>📷 Click to upload</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={() => setStep(4)} style={{ flex: 1, padding: 12, background: 'transparent', color: accent, border: `1.5px solid ${accent}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Back</button>
                <button onClick={() => setStep(6)} style={{ flex: 1, padding: 12, background: accent, color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Next</button>
              </div>
            </div>
          )}

          {/* Step 6: Documents */}
          {step === 6 && (
            <div>
              <DocumentUploader onDocumentsUpdated={setDocuments} documents={documents} />
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={() => setStep(5)} style={{ flex: 1, padding: 12, background: 'transparent', color: accent, border: `1.5px solid ${accent}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Back</button>
                <button onClick={() => setStep(7)} style={{ flex: 1, padding: 12, background: accent, color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Next</button>
              </div>
            </div>
          )}

          {/* Step 7: Website & Links */}
          {step === 7 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Website & Social Links</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, display: 'block' }}>Website URL (Optional)</label>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, display: 'block' }}>Social Media (Optional)</label>
                {['facebook', 'instagram', 'youtube', 'linkedin'].map((platform) => (
                  <div key={platform} style={{ marginBottom: 12 }}>
                    <input value={socialLinks[platform]} onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })} placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`} style={inputStyle} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={() => setStep(6)} style={{ flex: 1, padding: 12, background: 'transparent', color: accent, border: `1.5px solid ${accent}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Back</button>
                <button onClick={() => setStep(8)} style={{ flex: 1, padding: 12, background: accent, color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Next</button>
              </div>
            </div>
          )}

          {/* Step 8: Team & Plan */}
          {step === 8 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Team & Subscription Plan</h2>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 12, display: 'block' }}>Select a Plan</label>
                <div style={{ display: 'grid', gap: 12 }}>
                  {PLANS.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setPlan(p.id as any)}
                      style={{ padding: 16, border: `2px solid ${plan === p.id ? p.color : border}`, borderRadius: 12, background: plan === p.id ? `${p.color}22` : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: text }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: textMuted }}>₹{p.price}/month</div>
                        </div>
                        {plan === p.id && <Check style={{ width: 20, height: 20, color: p.color }} />}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {p.features.map((f) => <span key={f} style={{ fontSize: 11, background: inputBg, padding: '4px 8px', borderRadius: 4, color: textMuted }}>{f}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(7)} style={{ flex: 1, padding: 12, background: 'transparent', color: accent, border: `1.5px solid ${accent}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Back</button>
                <button onClick={finish} disabled={finishing} style={{ flex: 1, padding: 12, background: accent, color: 'white', border: 'none', borderRadius: 10, cursor: finishing ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: finishing ? 0.7 : 1 }}>
                  {finishing ? 'Finishing...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </div>

        {finishToast && <div style={{ marginTop: 16, padding: 12, background: '#22c55e22', border: '1px solid #22c55e', borderRadius: 10, color: '#22c55e', fontSize: 13 }}>{finishToast}</div>}
      </div>
    </div>
  );
}
