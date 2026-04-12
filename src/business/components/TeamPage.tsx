import { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2, Shield, CheckCircle, Mail, Phone, UserCheck, MoreVertical } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { supabase } from '@/app/lib/supabase';
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';
import { fetchBusinessTeamMembers, updateTeamMember, deleteTeamMember, logActivity } from '@/app/api/supabase-data';

type PermLevel = 'none' | 'read' | 'readwrite' | 'admin';
type Feature = 'leads' | 'campaigns' | 'invoices' | 'analytics' | 'notifications' | 'auctions' | 'requirements' | 'settings' | 'team';

const FEATURES: { key: Feature; label: string; icon: string }[] = [
  { key: 'leads',         label: 'Leads CRM',    icon: '🎯' },
  { key: 'campaigns',     label: 'Campaigns',    icon: '📣' },
  { key: 'invoices',      label: 'Invoices',     icon: '📄' },
  { key: 'analytics',     label: 'Analytics',    icon: '📊' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'auctions',      label: 'Auctions',     icon: '🏷️' },
  { key: 'requirements',  label: 'Requirements', icon: '📋' },
  { key: 'settings',      label: 'Settings',     icon: '⚙️' },
  { key: 'team',          label: 'Team Mgmt',    icon: '👥' },
];

const PERM_LEVELS: { value: PermLevel; label: string; color: string }[] = [
  { value: 'none',      label: 'No Access',  color: '#64748b' },
  { value: 'read',      label: 'Read',       color: '#3b82f6' },
  { value: 'readwrite', label: 'Read+Write', color: '#f59e0b' },
  { value: 'admin',     label: 'Admin',      color: '#22c55e' },
];

interface TeamMember {
  id: string;
  business_id: string;
  role_id?: string;
  name: string;
  email: string;
  phone?: string;
  permissions?: Record<Feature, PermLevel>;
  status: 'active' | 'inactive' | 'invited';
  created_at: string;
  // Auth fields
  password?: string;
  first_login?: boolean;
}

interface Role {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  permissions?: Record<Feature, PermLevel>;
}

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: 'm1', business_id: 'biz-1', name: 'Rahul Sharma', email: 'rahul@business.com',
    phone: '9876543210', status: 'active',
    permissions: { leads: 'readwrite', campaigns: 'read', invoices: 'read', analytics: 'read', notifications: 'read', auctions: 'none', requirements: 'read', settings: 'none', team: 'none' },
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'm2', business_id: 'biz-1', name: 'Priya Mehta', email: 'priya@business.com',
    phone: '9123456789', status: 'invited',
    permissions: { leads: 'admin', campaigns: 'readwrite', invoices: 'admin', analytics: 'admin', notifications: 'readwrite', auctions: 'readwrite', requirements: 'readwrite', settings: 'read', team: 'none' },
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const MOCK_ROLES: Role[] = [
  {
    id: 'r1', business_id: 'biz-1', name: 'Sales Rep', description: 'Can manage leads and view campaigns',
    permissions: { leads: 'readwrite', campaigns: 'read', invoices: 'read', analytics: 'read', notifications: 'read', auctions: 'none', requirements: 'read', settings: 'none', team: 'none' },
  },
  {
    id: 'r2', business_id: 'biz-1', name: 'Manager', description: 'Full access except team and settings',
    permissions: { leads: 'admin', campaigns: 'admin', invoices: 'admin', analytics: 'admin', notifications: 'admin', auctions: 'admin', requirements: 'admin', settings: 'read', team: 'none' },
  },
];

const EMPTY_PERMS: Record<Feature, PermLevel> = {
  leads: 'none', campaigns: 'none', invoices: 'none', analytics: 'none',
  notifications: 'none', auctions: 'none', requirements: 'none', settings: 'none', team: 'none',
};

// ── Predefined Role Templates ─────────────────────────────────────────────────
const ROLE_TEMPLATES: { name: string; description: string; icon: string; permissions: Record<Feature, PermLevel> }[] = [
  {
    name: 'Owner',
    description: 'Full access to everything',
    icon: '👑',
    permissions: {
      leads: 'admin', campaigns: 'admin', invoices: 'admin', analytics: 'admin',
      notifications: 'admin', auctions: 'admin', requirements: 'admin', settings: 'admin', team: 'admin',
    },
  },
  {
    name: 'Manager',
    description: 'All access except settings & team management',
    icon: '🏢',
    permissions: {
      leads: 'admin', campaigns: 'admin', invoices: 'admin', analytics: 'admin',
      notifications: 'readwrite', auctions: 'admin', requirements: 'admin', settings: 'none', team: 'none',
    },
  },
  {
    name: 'Staff',
    description: 'Orders and leads only',
    icon: '👤',
    permissions: {
      leads: 'readwrite', campaigns: 'read', invoices: 'read', analytics: 'read',
      notifications: 'read', auctions: 'none', requirements: 'read', settings: 'none', team: 'none',
    },
  },
];

// ── Add / Edit Member Modal ───────────────────────────────────────────────────

interface AddMemberModalProps {
  onClose: () => void;
  onSave: (member: Omit<TeamMember, 'id' | 'created_at'>) => void;
  initial?: TeamMember | null;
  roles: Role[];
  isDark: boolean;
  border: string;
  inputBg: string;
  text: string;
  muted: string;
  card: string;
  accent: string;
}

function AddMemberModal({ onClose, onSave, initial, roles, isDark, border, inputBg, text, muted, card, accent }: AddMemberModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [password, setPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState(initial?.role_id ?? '');
  const [perms, setPerms] = useState<Record<Feature, PermLevel>>(initial?.permissions ?? { ...EMPTY_PERMS });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const isNew = !initial;

  // When role changes, prefill perms from that role
  function handleRoleChange(roleId: string) {
    setSelectedRoleId(roleId);
    if (roleId) {
      const role = roles.find(r => r.id === roleId);
      if (role?.permissions) setPerms({ ...role.permissions });
    }
  }

  async function handleSave() {
    if (!name.trim() || !email.trim()) { setErr('Name and email are required'); return; }
    if (isNew && !password.trim()) { setErr('Password is required for new members'); return; }
    if (isNew && password.length < 8) { setErr('Password must be at least 8 characters'); return; }

    setSaving(true);
    try {
      let hashedPassword: string | undefined;
      if (isNew && password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      onSave({
        business_id: initial?.business_id ?? '',
        role_id: selectedRoleId || undefined,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        permissions: perms,
        status: initial?.status ?? 'invited',
        ...(isNew && hashedPassword ? { password: hashedPassword, first_login: true } : {}),
      } as Omit<TeamMember, 'id' | 'created_at'>);
    } finally {
      setSaving(false);
    }
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  };
  const modal: React.CSSProperties = {
    background: card, borderRadius: 16, padding: 28, maxWidth: 560, width: '100%',
    maxHeight: '90vh', overflowY: 'auto',
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6, display: 'block' };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: `1.5px solid ${border}`, background: inputBg, color: text,
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: text }}>{initial ? 'Edit Member' : '+ Add Team Member'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Basic info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="rahul@biz.com" style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Role (optional)</label>
            <select value={selectedRoleId} onChange={e => handleRoleChange(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">— Custom permissions —</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Password — only for new members */}
        {isNew && (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password *</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              style={inputStyle}
              autoComplete="new-password"
            />
            <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>
              Member will be prompted to change this on first login
            </div>
          </div>
        )}

        {/* Permission matrix */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 12 }}>Feature Permissions</div>
          {FEATURES.map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 130, fontSize: 12, color: text, flexShrink: 0 }}>{f.icon} {f.label}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {PERM_LEVELS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPerms(prev => ({ ...prev, [f.key]: p.value }))}
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      border: `1px solid ${perms[f.key] === p.value ? p.color : border}`,
                      background: perms[f.key] === p.value ? `${p.color}20` : 'none',
                      cursor: 'pointer', fontSize: 11,
                      color: perms[f.key] === p.value ? p.color : muted,
                      fontWeight: perms[f.key] === p.value ? 700 : 400,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {err && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${border}`, background: 'none', cursor: 'pointer', color: muted, fontSize: 13, fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, cursor: saving ? 'not-allowed' : 'pointer', color: '#fff', fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : initial ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add / Edit Role Modal ─────────────────────────────────────────────────────

interface AddRoleModalProps {
  onClose: () => void;
  onSave: (role: Omit<Role, 'id'>) => void;
  initial?: Role | null;
  isDark: boolean;
  border: string;
  inputBg: string;
  text: string;
  muted: string;
  card: string;
  accent: string;
}

function AddRoleModal({ onClose, onSave, initial, isDark, border, inputBg, text, muted, card, accent }: AddRoleModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [perms, setPerms] = useState<Record<Feature, PermLevel>>(initial?.permissions ?? { ...EMPTY_PERMS });
  const [err, setErr] = useState('');

  function handleSave() {
    if (!name.trim()) { setErr('Role name is required'); return; }
    onSave({
      business_id: initial?.business_id ?? '',
      name: name.trim(),
      description: description.trim() || undefined,
      permissions: perms,
    });
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  };
  const modal: React.CSSProperties = {
    background: card, borderRadius: 16, padding: 28, maxWidth: 540, width: '100%',
    maxHeight: '90vh', overflowY: 'auto',
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6, display: 'block' };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: `1.5px solid ${border}`, background: inputBg, color: text,
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: text }}>{initial ? 'Edit Role' : '+ Create Role'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {!initial && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 8 }}>Start from template</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {ROLE_TEMPLATES.map(t => (
                <button
                  key={t.name}
                  onClick={() => {
                    setName(t.name);
                    setDescription(t.description);
                    setPerms({ ...t.permissions });
                  }}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10,
                    border: `1.5px solid ${name === t.name ? accent : border}`,
                    background: name === t.name ? `${accent}18` : inputBg,
                    cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Role Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sales Rep" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this role" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 12 }}>Permissions</div>
          {FEATURES.map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 130, fontSize: 12, color: text, flexShrink: 0 }}>{f.icon} {f.label}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {PERM_LEVELS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPerms(prev => ({ ...prev, [f.key]: p.value }))}
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      border: `1px solid ${perms[f.key] === p.value ? p.color : border}`,
                      background: perms[f.key] === p.value ? `${p.color}20` : 'none',
                      cursor: 'pointer', fontSize: 11,
                      color: perms[f.key] === p.value ? p.color : muted,
                      fontWeight: perms[f.key] === p.value ? 700 : 400,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {err && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${border}`, background: 'none', cursor: 'pointer', color: muted, fontSize: 13, fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700 }}>
            {initial ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TeamPage ──────────────────────────────────────────────────────────────────

export function TeamPage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();

  const bg      = isDark ? '#080d20' : '#faf7f3';
  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const muted   = isDark ? '#64748b' : '#9a7860';
  const inputBg = isDark ? '#162040' : '#fdf6f0';
  const accent  = '#f97316';

  const [tab, setTab] = useState<'members' | 'roles'>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase on mount
  useEffect(() => {
    if (!supabase || !bizUser?.businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      supabase.from("business_team_members").select("*").eq("business_id", bizUser.businessId).order("created_at", { ascending: false }),
      supabase.from("business_roles").select("*, business_role_permissions(*)").eq("business_id", bizUser.businessId),
    ]).then(([membersRes, rolesRes]) => {
      if (membersRes.data?.length) setMembers(membersRes.data as TeamMember[]);
      if (rolesRes.data?.length) {
        const shaped = (rolesRes.data as any[]).map(r => {
          const permMap: Record<string, string> = {};
          (r.business_role_permissions ?? []).forEach((p: any) => { permMap[p.feature] = p.level; });
          return { ...r, permissions: permMap };
        });
        setRoles(shaped);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch team data:", err);
      setLoading(false);
    });
  }, [bizUser?.businessId]);

  // ── Member CRUD ─────────────────────────────────────────────────────────────

  async function handleSaveMember(data: Omit<TeamMember, 'id' | 'created_at'>) {
    const member = { ...data, business_id: bizUser?.businessId ?? data.business_id };
    if (editingMember) {
      // Update
      const success = await updateTeamMember(editingMember.id, member);
      if (success) {
        setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...editingMember, ...member } : m));
        logActivity({
          businessId: bizUser!.businessId!,
          actorId: bizUser!.id,
          actorType: bizUser!.isTeamMember ? 'team_member' : 'owner',
          actorName: bizUser!.name,
          action: 'update',
          entityType: 'team_member',
          entityId: editingMember.id,
          entityName: member.name,
          metadata: { email: member.email },
        });
        toast.success('Team member updated successfully');
      } else {
        toast.error('Failed to update team member');
      }
      setEditingMember(null);
    } else {
      // Insert new team member
      let insertedMember: TeamMember | null = null;
      if (supabase) {
        try {
          // Ensure password is included for new members
          const insertData = {
            ...member,
            // Explicitly include password if provided
            password: member.password || undefined,
            first_login: member.first_login ?? true,
            status: member.status || 'invited',
          };

          const { data: inserted, error } = await supabase
            .from('business_team_members')
            .insert(insertData)
            .select()
            .single();

          if (error) {
            console.error('Insert error:', error);
            toast.error(`Failed to add team member: ${error.message}`);
            return;
          }

          if (inserted) {
            insertedMember = inserted as TeamMember;
            setMembers(prev => [...prev, insertedMember!]);

            logActivity({
              businessId: bizUser!.businessId!,
              actorId: bizUser!.id,
              actorType: bizUser!.isTeamMember ? 'team_member' : 'owner',
              actorName: bizUser!.name,
              action: 'create',
              entityType: 'team_member',
              entityId: insertedMember.id,
              entityName: member.name,
              metadata: { email: member.email, hasPassword: !!member.password },
            });

            toast.success(`Team member ${member.email} added successfully. They can now login with the provided credentials.`);
          }
        } catch (err) {
          console.error('Add member error:', err);
          toast.error('Failed to add team member');
          return;
        }
      }
      setShowAddMember(false);
    }
  }

  async function handleDeleteMember(id: string) {
    const member = members.find(m => m.id === id);
    const success = await deleteTeamMember(id);
    if (success) {
      setMembers(prev => prev.filter(m => m.id !== id));
      logActivity({
        businessId: bizUser!.businessId!,
        actorId: bizUser!.id,
        actorType: bizUser!.isTeamMember ? 'team_member' : 'owner',
        actorName: bizUser!.name,
        action: 'delete',
        entityType: 'team_member',
        entityId: id,
        entityName: member?.name || 'Team Member',
        metadata: {},
      });
    }
  }

  // ── Role CRUD ───────────────────────────────────────────────────────────────

  async function handleSaveRole(data: Omit<Role, 'id'>) {
    const roleData = { ...data, business_id: bizUser?.businessId ?? data.business_id };
    if (editingRole) {
      if (supabase) {
        const { data: updated } = await supabase.from('business_roles').update({ name: roleData.name, description: roleData.description }).eq('id', editingRole.id).select().single();
        if (updated) {
          // Upsert permissions
          const perms = Object.entries(roleData.permissions ?? {})
            .filter(([, lvl]) => lvl !== 'none')
            .map(([feature, level]) => ({ role_id: editingRole.id, feature, level }));
          await supabase.from('business_role_permissions').delete().eq('role_id', editingRole.id);
          if (perms.length) await supabase.from('business_role_permissions').insert(perms);
          setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...roleData } : r));
        }
      } else {
        setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...editingRole, ...roleData } : r));
      }
      setEditingRole(null);
    } else {
      if (supabase) {
        const { data: inserted } = await supabase.from('business_roles').insert({ business_id: roleData.business_id, name: roleData.name, description: roleData.description }).select().single();
        if (inserted) {
          const perms = Object.entries(roleData.permissions ?? {})
            .filter(([, lvl]) => lvl !== 'none')
            .map(([feature, level]) => ({ role_id: (inserted as any).id, feature, level }));
          if (perms.length) await supabase.from('business_role_permissions').insert(perms);
          setRoles(prev => [...prev, { ...(inserted as any), permissions: roleData.permissions }]);
        }
      } else {
        setRoles(prev => [...prev, { ...roleData, id: crypto.randomUUID() }]);
      }
      setShowAddRole(false);
    }
  }

  async function handleDeleteRole(id: string) {
    if (supabase) {
      await supabase.from('business_roles').delete().eq('id', id);
    }
    setRoles(prev => prev.filter(r => r.id !== id));
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const invitedMembers = members.filter(m => m.status === 'invited').length;
  const totalRoles = roles.length;

  const statCards = [
    { label: 'Total Members', value: totalMembers, color: '#3b82f6', icon: '👥' },
    { label: 'Active',        value: activeMembers, color: '#22c55e', icon: '✅' },
    { label: 'Invited',       value: invitedMembers, color: '#f59e0b', icon: '✉️' },
    { label: 'Total Roles',   value: totalRoles,    color: accent,    icon: '🛡️' },
  ];

  const themeProps = { isDark, border, inputBg, text, muted, card, accent };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}22`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} color={accent} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: text }}>Team Management</div>
            <div style={{ fontSize: 12, color: muted }}>Add members and manage their access permissions</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${accent}20`, color: accent, border: `1px solid ${accent}44` }}>
            👑 Owner (Admin)
          </span>
          <button
            onClick={() => tab === 'members' ? setShowAddMember(true) : setShowAddRole(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700 }}
          >
            <Plus size={15} />
            {tab === 'members' ? 'Add Member' : 'Add Role'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: isDark ? '#0e1530' : '#f3f4f6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['members', 'roles'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t ? (isDark ? '#162040' : '#fff') : 'transparent',
              color: tab === t ? text : muted,
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t === 'members' ? `👥 Members (${totalMembers})` : `🛡️ Roles (${totalRoles})`}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid ${border}`, background: card }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: muted, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Members Tab */}
      {tab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {members.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: muted, background: card, borderRadius: 12, border: `1px solid ${border}` }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No team members yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Add your first team member to get started</div>
            </div>
          )}
          {members.map(m => (
            <div key={m.id} style={{ padding: '16px', borderRadius: 12, border: `1px solid ${border}`, background: inputBg, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              {/* Avatar */}
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {m.name[0]?.toUpperCase()}
              </div>
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: text }}>{m.name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: m.status === 'active' ? '#22c55e20' : m.status === 'invited' ? '#f59e0b20' : '#64748b20',
                    color: m.status === 'active' ? '#22c55e' : m.status === 'invited' ? '#f59e0b' : '#64748b',
                  }}>
                    {m.status.toUpperCase()}
                  </span>
                  {roles.find(r => r.id === m.role_id) && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${accent}20`, color: accent }}>
                      🛡️ {roles.find(r => r.id === m.role_id)?.name}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: muted, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>✉️ {m.email}</span>
                  {m.phone && <span>📞 {m.phone}</span>}
                </div>
                {/* Permission pills */}
                {m.permissions && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {FEATURES.filter(f => m.permissions![f.key] && m.permissions![f.key] !== 'none').map(f => (
                      <span key={f.key} style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 10,
                        background: m.permissions![f.key] === 'admin' ? '#22c55e20' : m.permissions![f.key] === 'readwrite' ? '#f59e0b20' : '#3b82f620',
                        color: m.permissions![f.key] === 'admin' ? '#22c55e' : m.permissions![f.key] === 'readwrite' ? '#f59e0b' : '#3b82f6',
                        fontWeight: 600,
                      }}>
                        {f.icon} {f.label}: {PERM_LEVELS.find(p => p.value === m.permissions![f.key])?.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => setEditingMember(m)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${border}`, background: 'none', cursor: 'pointer', color: muted }}>
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDeleteMember(m.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ef444430', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roles Tab */}
      {tab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roles.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: muted, background: card, borderRadius: 12, border: `1px solid ${border}` }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🛡️</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No roles yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Create a role to bundle permissions for team members</div>
            </div>
          )}
          {roles.map(role => (
            <div key={role.id} style={{ padding: '18px', borderRadius: 12, border: `1px solid ${border}`, background: inputBg }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Shield size={16} color={accent} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: text }}>{role.name}</span>
                    <span style={{ fontSize: 11, color: muted }}>
                      ({members.filter(m => m.role_id === role.id).length} member{members.filter(m => m.role_id === role.id).length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  {role.description && (
                    <div style={{ fontSize: 12, color: muted, marginBottom: 10 }}>{role.description}</div>
                  )}
                  {/* Permission matrix */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10 }}>
                    {FEATURES.map(f => {
                      const lvl = role.permissions?.[f.key] ?? 'none';
                      return (
                        <div key={f.key} style={{
                          display: 'flex', gap: 4, alignItems: 'center', fontSize: 11,
                          color: lvl === 'none' ? '#64748b' : lvl === 'admin' ? '#22c55e' : lvl === 'readwrite' ? '#f59e0b' : '#3b82f6',
                        }}>
                          <span>{f.icon}</span>
                          <span style={{ fontWeight: lvl !== 'none' ? 700 : 400 }}>
                            {f.label}: {lvl === 'none' ? '–' : PERM_LEVELS.find(p => p.value === lvl)?.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setEditingRole(role)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${border}`, background: 'none', cursor: 'pointer', color: muted }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDeleteRole(role.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ef444430', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {(showAddMember) && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onSave={handleSaveMember}
          roles={roles}
          {...themeProps}
        />
      )}
      {editingMember && (
        <AddMemberModal
          onClose={() => setEditingMember(null)}
          onSave={handleSaveMember}
          initial={editingMember}
          roles={roles}
          {...themeProps}
        />
      )}
      {showAddRole && (
        <AddRoleModal
          onClose={() => setShowAddRole(false)}
          onSave={handleSaveRole}
          {...themeProps}
        />
      )}
      {editingRole && (
        <AddRoleModal
          onClose={() => setEditingRole(null)}
          onSave={handleSaveRole}
          initial={editingRole}
          {...themeProps}
        />
      )}
    </div>
  );
}
