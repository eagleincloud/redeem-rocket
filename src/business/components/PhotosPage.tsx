import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { Image, Star, Trash2, ArrowUp, ArrowDown, Check, Upload } from 'lucide-react';
import { fetchBusinessPhotos, deleteBusinessPhoto, uploadBusinessPhoto, logActivity } from '@/app/api/supabase-data';
import { toast } from 'sonner';

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

interface Photo {
  id: string;
  gradient: string;
  label: string;
  isCover: boolean;
  order: number;
  emoji: string;
}

export function PhotosPage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const accent  = '#f97316';
  const businessId = bizUser?.businessId || bizUser?.id;

  // Fetch photos on mount
  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetchBusinessPhotos(businessId)
      .then(data => {
        if (data && data.length > 0) {
          const converted = data.map((p: any, idx: number) => ({
            id: p.id,
            gradient: GRADIENTS[idx % GRADIENTS.length],
            label: p.name || `Photo ${idx + 1}`,
            isCover: p.is_cover || idx === 0,
            order: p.sort_order || idx,
            emoji: p.emoji || ['🏪', '📦', '🛒', '✨', '🎁', '⭐'][idx % 6],
          }));
          setPhotos(converted);
        }
      })
      .finally(() => setLoading(false));
  }, [businessId]);

  function setCover(id: string) {
    setPhotos(ps => ps.map(p => ({ ...p, isCover: p.id === id })));
  }

  function moveUp(id: string) {
    setPhotos(ps => {
      const idx = ps.findIndex(p => p.id === id);
      if (idx === 0) return ps;
      const arr = [...ps];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr.map((p, i) => ({ ...p, order: i }));
    });
  }

  function moveDown(id: string) {
    setPhotos(ps => {
      const idx = ps.findIndex(p => p.id === id);
      if (idx >= ps.length - 1) return ps;
      const arr = [...ps];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr.map((p, i) => ({ ...p, order: i }));
    });
  }

  function addPhoto() {
    if (photos.length >= 6) return;
    const nextIdx = photos.length;
    const newPhoto: Photo = {
      id: `ph${Date.now()}`,
      gradient: GRADIENTS[nextIdx % GRADIENTS.length],
      label: `Photo ${nextIdx + 1}`,
      isCover: false,
      order: nextIdx,
      emoji: ['🏪', '📦', '🛒', '✨', '🎁', '⭐'][nextIdx % 6],
    };
    setPhotos(ps => [...ps, newPhoto]);
  }

  async function removePhoto(id: string) {
    setPhotos(ps => {
      const updated = ps.filter(p => p.id !== id).map((p, i) => ({ ...p, order: i }));
      // If we removed the cover, make first photo cover
      if (updated.length > 0 && !updated.some(p => p.isCover)) {
        updated[0] = { ...updated[0], isCover: true };
      }
      return updated;
    });
    setDeleteId(null);

    // Delete from DB
    deleteBusinessPhoto(id);
    logActivity({
      businessId: businessId!,
      actorId: bizUser!.id,
      actorType: bizUser!.isTeamMember ? 'team_member' : 'owner',
      actorName: bizUser!.name,
      action: 'delete',
      entityType: 'photo',
      entityId: id,
      entityName: 'Business Photo',
      metadata: {},
    });
  }

  async function saveOrder() {
    setSaved(true);
    logActivity({
      businessId: businessId!,
      actorId: bizUser!.id,
      actorType: bizUser!.isTeamMember ? 'team_member' : 'owner',
      actorName: bizUser!.name,
      action: 'update',
      entityType: 'photos',
      entityId: '',
      entityName: 'Photo Order',
      metadata: { count: photos.length },
    });
    setTimeout(() => setSaved(false), 1500);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: textMuted }}>
        <div>Loading photos…</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: text, marginBottom: 2 }}>Business Photos</h1>
          <p style={{ fontSize: 13, color: textMuted }}>Manage up to 6 photos · Drag to reorder · Set cover image</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {photos.length < 6 && (
            <button onClick={addPhoto} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Upload size={15} /> Add Photo
            </button>
          )}
          <button onClick={saveOrder} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: 'none', background: saved ? '#22c55e' : `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saved ? <><Check size={15} /> Saved!</> : 'Save Order'}
          </button>
        </div>
      </div>

      {/* Cover photo preview */}
      {photos.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: textMuted, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Cover Photo Preview</h3>
          <div style={{ height: 200, borderRadius: 20, background: photos.find(p => p.isCover)?.gradient ?? GRADIENTS[0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, position: 'relative', overflow: 'hidden', border: `2px solid ${accent}` }}>
            <span>{photos.find(p => p.isCover)?.emoji ?? '🏪'}</span>
            <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" /> Cover Photo
            </div>
          </div>
        </div>
      )}

      {/* Photo grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {photos.map((photo, idx) => (
          <div key={photo.id} style={{ background: card, borderRadius: 16, border: `2px solid ${photo.isCover ? accent : border}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
            <div style={{ height: 160, background: photo.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, position: 'relative' }}>
              <span>{photo.emoji}</span>
              {photo.isCover && (
                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={10} fill="#f59e0b" color="#f59e0b" /> COVER
                </div>
              )}
              <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>
                {idx + 1}
              </div>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 10 }}>{photo.label}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {!photo.isCover && (
                  <button onClick={() => setCover(photo.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: `1px solid #f59e0b44`, background: '#f59e0b11', color: '#f59e0b', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    <Star size={12} /> Set Cover
                  </button>
                )}
                <button onClick={() => moveUp(photo.id)} disabled={idx === 0} style={{ padding: '5px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: idx === 0 ? border : textMuted, cursor: idx === 0 ? 'not-allowed' : 'pointer', display: 'flex' }}>
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => moveDown(photo.id)} disabled={idx === photos.length - 1} style={{ padding: '5px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: idx === photos.length - 1 ? border : textMuted, cursor: idx === photos.length - 1 ? 'not-allowed' : 'pointer', display: 'flex' }}>
                  <ArrowDown size={14} />
                </button>
                {!photo.isCover && (
                  <button onClick={() => setDeleteId(photo.id)} style={{ padding: '5px', borderRadius: 8, border: '1px solid #ef444444', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', marginLeft: 'auto' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 6 - photos.length) }).map((_, i) => (
          <div key={`empty-${i}`} onClick={addPhoto} style={{ height: 200, borderRadius: 16, border: `2px dashed ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: photos.length < 6 ? 'pointer' : 'default', gap: 8, background: isDark ? '#0f0f1e' : '#fdf6f0', transition: 'border-color 0.2s' }}
            onMouseEnter={e => photos.length < 6 && ((e.currentTarget as HTMLElement).style.borderColor = accent)}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = border}
          >
            <Image size={28} color={textMuted} />
            <span style={{ fontSize: 12, color: textMuted }}>{photos.length < 6 ? 'Click to add photo' : 'Max 6 photos'}</span>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, padding: 16 }}>
        <h4 style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 8 }}>📸 Photo Tips</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Use bright, well-lit photos for best results', 'Cover photo appears first in search results', 'Show your shop front, products, and ambience', 'High-quality images increase customer visits by 40%'].map(tip => (
            <div key={tip} style={{ display: 'flex', gap: 8, fontSize: 12, color: textMuted }}>
              <span>•</span> {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <>
          <div onClick={() => setDeleteId(null)} style={{ position: 'fixed', inset: 0, background: '#00000066', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: isDark ? '#162040' : '#fff', border: `1px solid ${border}`, borderRadius: 16, padding: 24, width: 300, zIndex: 70, textAlign: 'center' }}>
            <Trash2 size={32} color="#ef4444" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 8 }}>Remove Photo?</h3>
            <p style={{ fontSize: 13, color: textMuted, marginBottom: 20 }}>This photo will be removed from your gallery.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => removePhoto(deleteId)} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Remove</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
