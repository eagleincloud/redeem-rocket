import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useViewport } from '../hooks/useViewport';
import {
  Upload, Link2, Code2, Key, Copy, Check, Play, RefreshCw,
  Eye, EyeOff, ChevronDown, AlertTriangle, Zap, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/app/lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────

type FieldMapping = 'name' | 'email' | 'phone' | 'company' | 'notes' | 'skip';

interface CsvRow {
  [key: string]: string;
}

interface ColumnMap {
  [csvColumn: string]: FieldMapping;
}

const FIELD_OPTIONS: { value: FieldMapping; label: string }[] = [
  { value: 'name',    label: 'Full Name'   },
  { value: 'email',   label: 'Email'       },
  { value: 'phone',   label: 'Phone'       },
  { value: 'company', label: 'Company'     },
  { value: 'notes',   label: 'Notes'       },
  { value: 'skip',    label: '— Skip —'    },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: CsvRow = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
  return { headers, rows };
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function maskKey(key: string): string {
  if (!key) return '';
  return key.slice(0, 8) + '••••••••••••••••••••' + key.slice(-4);
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        background: active ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.15)',
        color:   active ? '#4ade80' : '#9ca3af',
        border: `1px solid ${active ? 'rgba(74,222,128,0.25)' : 'rgba(107,114,128,0.2)'}`,
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: active ? '#4ade80' : '#6b7280',
        display: 'inline-block',
      }} />
      {active ? 'Active' : 'Not configured'}
    </span>
  );
}

// ─── Card Shell ────────────────────────────────────────────────────────────────

function ConnectorCard({
  isDark,
  icon,
  title,
  description,
  active,
  children,
}: {
  isDark: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: isDark
          ? 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.06) 0%, #111827 60%)'
          : 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.04) 0%, #ffffff 60%)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: 16,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6366f1',
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 4 }}>
              {title}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
              {description}
            </div>
          </div>
        </div>
        <StatusBadge active={active} />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}

// ─── Reusable styled primitives ────────────────────────────────────────────────

function Btn({
  onClick, disabled, variant = 'primary', children, style: extra,
}: {
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '8px 16px', borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, border: 'none', outline: 'none',
    transition: 'opacity .15s',
  };
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: '#6366f1', color: '#fff' },
    secondary: { background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' },
    danger:    { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
    ghost:     { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...styles[variant], ...extra }}>
      {children}
    </button>
  );
}

function CodeBlock({ code, isDark }: { code: string; isDark: boolean }) {
  return (
    <pre
      style={{
        margin: 0, padding: '14px 16px', borderRadius: 10,
        background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
        fontSize: 12, lineHeight: 1.7,
        color: isDark ? '#a5b4fc' : '#4338ca',
        overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
      }}
    >
      {code}
    </pre>
  );
}

function CopyButton({ text, isDark }: { text: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Btn onClick={copy} variant="ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </Btn>
  );
}

// ─── CSV Import Card ───────────────────────────────────────────────────────────

function CsvImportCard({ isDark, businessId }: { isDark: boolean; businessId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders]     = useState<string[]>([]);
  const [preview, setPreview]     = useState<CsvRow[]>([]);
  const [allRows, setAllRows]     = useState<CsvRow[]>([]);
  const [mapping, setMapping]     = useState<ColumnMap>({});
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<{ imported: number; failed: number } | null>(null);
  const [fileName, setFileName]   = useState('');

  const isActive = headers.length > 0;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const { headers: h, rows } = parseCsv(text);
      setHeaders(h);
      setPreview(rows.slice(0, 3));
      setAllRows(rows);
      // auto-guess mapping
      const autoMap: ColumnMap = {};
      h.forEach(col => {
        const lower = col.toLowerCase();
        if (/name/.test(lower)) autoMap[col] = 'name';
        else if (/email|mail/.test(lower)) autoMap[col] = 'email';
        else if (/phone|mobile|tel/.test(lower)) autoMap[col] = 'phone';
        else if (/company|business|org/.test(lower)) autoMap[col] = 'company';
        else if (/note|comment/.test(lower)) autoMap[col] = 'notes';
        else autoMap[col] = 'skip';
      });
      setMapping(autoMap);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!businessId || allRows.length === 0) return;
    setLoading(true);
    let imported = 0; let failed = 0;
    const batch = allRows.map(row => {
      const lead: Record<string, string | null> = { business_id: businessId };
      Object.entries(mapping).forEach(([col, field]) => {
        if (field !== 'skip') lead[field] = row[col] ?? null;
      });
      return lead;
    });
    const { error } = await supabase.from('leads').insert(batch);
    if (error) {
      failed = batch.length;
      toast.error('Import failed: ' + error.message);
    } else {
      imported = batch.length;
      toast.success(`Imported ${imported} leads`);
    }
    setResult({ imported, failed });
    setLoading(false);
  };

  return (
    <ConnectorCard
      isDark={isDark}
      icon={<Upload size={20} />}
      title="CSV Import"
      description="Upload a CSV file and map columns to import leads in bulk"
      active={isActive}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Upload button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn onClick={() => fileRef.current?.click()} variant="secondary">
            <Upload size={14} /> Upload CSV
          </Btn>
          {fileName && (
            <span style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>
              {fileName}
            </span>
          )}
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleFile} />
        </div>

        {/* Column mapper */}
        {headers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Map Columns
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {headers.map(col => (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{col}</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={mapping[col] ?? 'skip'}
                      onChange={e => setMapping(prev => ({ ...prev, [col]: e.target.value as FieldMapping }))}
                      style={{
                        width: '100%', padding: '6px 28px 6px 10px', borderRadius: 8,
                        background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        color: isDark ? '#f1f5f9' : '#0f172a',
                        fontSize: 13, appearance: 'none', cursor: 'pointer',
                      }}
                    >
                      {FIELD_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Preview (first {preview.length} rows)
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)' }}>
                    {headers.map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                      {headers.map(h => (
                        <td key={h} style={{ padding: '7px 12px', color: isDark ? '#cbd5e1' : '#374151', whiteSpace: 'nowrap' }}>
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import button & result */}
        {headers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Btn onClick={handleImport} disabled={loading} variant="primary">
              {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
              {loading ? 'Importing…' : `Import ${allRows.length} Leads`}
            </Btn>
            {result && (
              <span style={{ fontSize: 13, color: result.failed > 0 ? '#f87171' : '#4ade80' }}>
                {result.failed > 0
                  ? `${result.imported} imported, ${result.failed} failed`
                  : `${result.imported} leads imported successfully`}
              </span>
            )}
          </div>
        )}
      </div>
    </ConnectorCard>
  );
}

// ─── Webhook Card ──────────────────────────────────────────────────────────────

const SAMPLE_PAYLOAD = JSON.stringify(
  { name: 'Jane Doe', email: 'jane@example.com', phone: '+1 555 0100', source: 'website' },
  null, 2
);

function WebhookCard({ isDark, businessId }: { isDark: boolean; businessId: string }) {
  const [testing, setTesting] = useState(false);
  const webhookUrl = `https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/lead-ingest?business_id=${businessId}`;

  const testWebhook = async () => {
    setTesting(true);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Lead', email: 'test@example.com', phone: '+1 000 0000', source: 'test' }),
      });
      if (res.ok) toast.success('Webhook test successful');
      else toast.error(`Webhook returned ${res.status}`);
    } catch {
      toast.error('Could not reach webhook endpoint');
    } finally {
      setTesting(false);
    }
  };

  return (
    <ConnectorCard
      isDark={isDark}
      icon={<Zap size={20} />}
      title="Webhook"
      description="Send leads directly to your unique webhook URL from any external tool"
      active={!!businessId}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* URL row */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Webhook URL
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 10, padding: '10px 14px',
          }}>
            <Link2 size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
            <span style={{
              flex: 1, fontSize: 12, fontFamily: 'monospace',
              color: isDark ? '#a5b4fc' : '#4338ca',
              overflowX: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {webhookUrl}
            </span>
            <CopyButton text={webhookUrl} isDark={isDark} />
          </div>
        </div>

        {/* Sample payload */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Sample Payload
          </div>
          <CodeBlock code={SAMPLE_PAYLOAD} isDark={isDark} />
        </div>

        {/* Test button */}
        <div>
          <Btn onClick={testWebhook} disabled={testing || !businessId} variant="secondary">
            {testing
              ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Play size={14} />}
            {testing ? 'Sending…' : 'Test Webhook'}
          </Btn>
        </div>
      </div>
    </ConnectorCard>
  );
}

// ─── Embed Form Card ───────────────────────────────────────────────────────────

type EmbedField = 'name' | 'email' | 'phone' | 'message';

const ALL_EMBED_FIELDS: { key: EmbedField; label: string }[] = [
  { key: 'name',    label: 'Name'    },
  { key: 'email',   label: 'Email'   },
  { key: 'phone',   label: 'Phone'   },
  { key: 'message', label: 'Message' },
];

function EmbedFormCard({ isDark, businessId }: { isDark: boolean; businessId: string }) {
  const [enabledFields, setEnabledFields] = useState<Record<EmbedField, boolean>>({
    name: true, email: true, phone: true, message: false,
  });
  const [showPreview, setShowPreview] = useState(false);

  const toggle = (field: EmbedField) =>
    setEnabledFields(prev => ({ ...prev, [field]: !prev[field] }));

  const fields = ALL_EMBED_FIELDS.filter(f => enabledFields[f.key]);
  const fieldList = fields.map(f => f.key).join(',');
  const embedCode = `<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/lead-form-embed.js';
    s.dataset.businessId = '${businessId}';
    s.dataset.fields = '${fieldList}';
    s.async = true;
    document.currentScript.parentNode.insertBefore(s, document.currentScript);
  })();
</script>`;

  return (
    <ConnectorCard
      isDark={isDark}
      icon={<Code2 size={20} />}
      title="Embed Form"
      description="Add a lead capture form to any website with a single script tag"
      active={!!businessId}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Field toggles */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Form Fields
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ALL_EMBED_FIELDS.map(f => (
              <button
                key={f.key}
                onClick={() => toggle(f.key)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: 'none', outline: 'none',
                  background: enabledFields[f.key]
                    ? 'rgba(99,102,241,0.18)'
                    : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  color: enabledFields[f.key] ? '#a5b4fc' : '#6b7280',
                  boxShadow: enabledFields[f.key] ? '0 0 0 1px rgba(99,102,241,0.4)' : 'none',
                  transition: 'all .15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Embed code */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Embed Code
            </div>
            <CopyButton text={embedCode} isDark={isDark} />
          </div>
          <CodeBlock code={embedCode} isDark={isDark} />
        </div>

        {/* Preview toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Btn onClick={() => setShowPreview(v => !v)} variant="ghost">
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Btn>

          {showPreview && (
            <div style={{
              padding: 20, borderRadius: 12,
              background: isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 14 }}>
                Contact Us
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {fields.map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      {f.label}
                    </label>
                    {f.key === 'message' ? (
                      <textarea
                        placeholder={f.label}
                        rows={3}
                        readOnly
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                          background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                          color: isDark ? '#f1f5f9' : '#0f172a', resize: 'none', boxSizing: 'border-box',
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={f.label}
                        readOnly
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                          background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                          color: isDark ? '#f1f5f9' : '#0f172a', boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                ))}
                <button
                  style={{
                    marginTop: 4, padding: '9px 0', borderRadius: 8, fontSize: 13,
                    fontWeight: 700, background: '#6366f1', color: '#fff',
                    border: 'none', cursor: 'default',
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ConnectorCard>
  );
}

// ─── API Key Card ──────────────────────────────────────────────────────────────

function ApiKeyCard({ isDark, businessId }: { isDark: boolean; businessId: string }) {
  const [apiKey, setApiKey]       = useState<string | null>(null);
  const [revealed, setRevealed]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [connectorId, setConnectorId] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    supabase
      .from('lead_connectors')
      .select('id, api_key')
      .eq('business_id', businessId)
      .eq('type', 'api')
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setApiKey(data.api_key); setConnectorId(data.id); }
      });
  }, [businessId]);

  const generateKey = async (isRegen = false) => {
    if (isRegen) {
      const confirmed = window.confirm(
        'Regenerating the API key will break all existing integrations using the old key. Continue?'
      );
      if (!confirmed) return;
    }
    setLoading(true);
    const newKey = generateUUID();
    if (connectorId) {
      const { error } = await supabase
        .from('lead_connectors')
        .update({ api_key: newKey, updated_at: new Date().toISOString() })
        .eq('id', connectorId);
      if (error) { toast.error('Failed to regenerate key'); setLoading(false); return; }
    } else {
      const { data, error } = await supabase
        .from('lead_connectors')
        .insert({ business_id: businessId, type: 'api', api_key: newKey })
        .select('id')
        .single();
      if (error) { toast.error('Failed to generate key'); setLoading(false); return; }
      setConnectorId(data.id);
    }
    setApiKey(newKey);
    setRevealed(true);
    toast.success(isRegen ? 'API key regenerated' : 'API key generated');
    setLoading(false);
  };

  const curlExample = apiKey
    ? `curl -X POST \\
  https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/lead-ingest \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${revealed ? apiKey : maskKey(apiKey)}" \\
  -d '{"name":"Jane Doe","email":"jane@example.com","phone":"+1 555 0100"}'`
    : `# Generate an API key first, then use it like:\ncurl -X POST \\\n  https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/lead-ingest \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -d '{"name":"Jane Doe","email":"jane@example.com"}'`;

  return (
    <ConnectorCard
      isDark={isDark}
      icon={<Key size={20} />}
      title="API Key"
      description="Programmatically push leads from your own code or integrations"
      active={!!apiKey}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Key display */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            API Key
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 10, padding: '10px 14px',
          }}>
            <Key size={14} style={{ color: '#f97316', flexShrink: 0 }} />
            <span style={{
              flex: 1, fontSize: 12, fontFamily: 'monospace',
              color: isDark ? '#fdba74' : '#c2410c',
              letterSpacing: apiKey && !revealed ? '0.08em' : undefined,
            }}>
              {apiKey
                ? (revealed ? apiKey : maskKey(apiKey))
                : 'No key generated'}
            </span>
            {apiKey && (
              <>
                <button
                  onClick={() => setRevealed(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
                  title={revealed ? 'Hide key' : 'Reveal key'}
                >
                  {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <CopyButton text={apiKey} isDark={isDark} />
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {!apiKey ? (
            <Btn onClick={() => generateKey(false)} disabled={loading} variant="primary">
              {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={14} />}
              {loading ? 'Generating…' : 'Generate Key'}
            </Btn>
          ) : (
            <Btn onClick={() => generateKey(true)} disabled={loading} variant="danger">
              {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <AlertTriangle size={14} />}
              {loading ? 'Regenerating…' : 'Regenerate'}
            </Btn>
          )}
          <a
            href="https://supabase.com/docs/reference/javascript/introduction"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
          >
            <ExternalLink size={13} /> API Docs
          </a>
        </div>

        {/* cURL example */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            cURL Example
          </div>
          <CodeBlock code={curlExample} isDark={isDark} />
        </div>
      </div>
    </ConnectorCard>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function ConnectorsPage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const { isMobile } = useViewport();

  const businessId = bizUser?.businessId ?? '';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0b1220' : '#f8fafc',
        padding: isMobile ? '20px 16px 40px' : '32px 32px 60px',
      }}
    >
      {/* Spin keyframe injected once */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Page header */}
      <div style={{ marginBottom: isMobile ? 24 : 32 }}>
        <h1
          style={{
            margin: 0, fontSize: isMobile ? 22 : 28,
            fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a',
            letterSpacing: '-0.02em',
          }}
        >
          Lead Connectors
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
          Connect your lead sources to automatically import contacts into your CRM
        </p>
      </div>

      {/* 2×2 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? 16 : 24,
        }}
      >
        <CsvImportCard isDark={isDark} businessId={businessId} />
        <WebhookCard   isDark={isDark} businessId={businessId} />
        <EmbedFormCard isDark={isDark} businessId={businessId} />
        <ApiKeyCard    isDark={isDark} businessId={businessId} />
      </div>
    </div>
  );
}
