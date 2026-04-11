import { useNavigate } from 'react-router';
import { useTheme } from '@/app/context/ThemeContext';
import { CheckCircle, ArrowRight, Copy, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function StartPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bg = isDark ? '#080d20' : '#faf7f3';
  const card = isDark ? '#0e1530' : '#ffffff';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const accent = '#f97316';

  const demoCredentials = [
    {
      title: 'Business Account',
      email: 'business@example.com',
      password: 'Business@123',
      type: 'business',
    },
    {
      title: 'Admin Account',
      email: 'admin@example.com',
      password: 'Admin@123',
      type: 'admin',
    },
  ];

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(135deg, ${accent}22 0%, transparent 50%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 10, padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60, marginTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🚀</div>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: text, marginBottom: 12 }}>Redeem Rocket</h1>
          <p style={{ fontSize: 16, color: textMuted, maxWidth: 600, margin: '0 auto' }}>
            Manage your business, engage customers, and grow your revenue with our all-in-one platform
          </p>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 30 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: text, marginBottom: 24 }}>Key Features</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '📦', title: 'Product Management', desc: 'Manage inventory and catalog' },
                { icon: '💰', title: 'Order Processing', desc: 'Track and manage customer orders' },
                { icon: '👥', title: 'Team Collaboration', desc: 'Manage team members and roles' },
                { icon: '📸', title: 'Business Gallery', desc: 'Showcase your products with photos' },
                { icon: '📊', title: 'Analytics', desc: 'Track performance and insights' },
                { icon: '💸', title: 'Wallet System', desc: 'Manage payments and cashback' },
              ].map((feature) => (
                <div key={feature.title} style={{ display: 'flex', gap: 14, padding: 16, borderRadius: 12, border: `1px solid ${border}`, background: card }}>
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{feature.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>{feature.title}</div>
                    <div style={{ fontSize: 12, color: textMuted }}>{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: text, marginBottom: 24 }}>Demo Credentials</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {demoCredentials.map((cred, idx) => (
                <div key={idx} style={{ padding: 20, borderRadius: 16, border: `2px solid ${accent}`, background: isDark ? '#1a1f3a' : '#fff9f5', boxShadow: `0 8px 16px ${accent}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${border}` }}>
                    <CheckCircle size={20} color={accent} />
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: text }}>{cred.title}</h3>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: isDark ? '#0e1530' : '#fdf6f0' }}>
                      <code style={{ fontSize: 12, color: text, flex: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>{cred.email}</code>
                      <button onClick={() => copyToClipboard(cred.email, `email-${idx}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedField === `email-${idx}` ? accent : textMuted, display: 'flex', padding: '4px' }} title="Copy email">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Password</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: isDark ? '#0e1530' : '#fdf6f0' }}>
                      <code style={{ fontSize: 12, color: text, flex: 1, fontFamily: 'monospace' }}>{showPassword ? cred.password : '••••••••'}</code>
                      <button onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, display: 'flex', padding: '4px' }} title={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => copyToClipboard(cred.password, `password-${idx}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedField === `password-${idx}` ? accent : textMuted, display: 'flex', padding: '4px' }} title="Copy password">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}>
                    Login as {cred.type === 'admin' ? 'Admin' : 'Business'} <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 60, padding: 24, borderRadius: 16, border: `1px solid ${border}`, background: card, textAlign: 'center', maxWidth: 600, margin: '60px auto 0' }}>
          <p style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>
            💡 <strong>Tip:</strong> These are demo credentials for testing. Create your own account for production use.
          </p>
          <p style={{ fontSize: 12, color: textMuted }}>
            Don't have an account?{' '}
            <button onClick={() => navigate('/signup')} style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', textDecoration: 'underline', fontWeight: 700 }}>
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
