import { useState, useRef, useCallback } from 'react';
import { X, Upload, Download, Search, ChevronLeft, ChevronRight, GitBranch, Loader, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import {
  fetchScrapedForImport, insertLead, groupImportRowsByEntity, linkLeadToEntity, createLeadEntity,
  type Lead, type ScrapedBizForImport, type ImportCluster,
} from '@/app/api/supabase-data';

const FREE_LEAD_CAP = 10;

interface Props {
  onClose: () => void;
  onImported: (leads: Lead[]) => void;
  currentLeadCount: number;
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let field = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { field += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(field.trim());
      field = '';
    } else {
      field += ch;
    }
  }
  result.push(field.trim());
  return result;
}

function parseCSV(raw: string): { headers: string[]; rows: string[][] } {
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 1) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);
  return { headers, rows };
}

const LEAD_FIELD_LABELS: Record<string, string> = {
  name:             'Name',
  phone:            'Phone',
  email:            'Email',
  company:          'Company',
  deal_value:       'Deal Value (₹)',
  product_interest: 'Product Interest',
  notes:            'Notes',
  skip:             '— Skip —',
};

const AUTO_MAP: Record<string, string> = {
  name: 'name', 'full name': 'name', customer: 'name', contact: 'name',
  phone: 'phone', mobile: 'phone', 'phone number': 'phone', tel: 'phone',
  email: 'email', 'email address': 'email',
  company: 'company', business: 'company', organization: 'company', org: 'company',
  value: 'deal_value', amount: 'deal_value', deal: 'deal_value', price: 'deal_value',
  product: 'product_interest', interest: 'product_interest', service: 'product_interest',
  notes: 'notes', note: 'notes', remarks: 'notes', comment: 'notes',
};

function autoDetectMapping(headers: string[]): Record<number, string> {
  const map: Record<number, string> = {};
  headers.forEach((h, i) => {
    const lower = h.toLowerCase().trim();
    map[i] = AUTO_MAP[lower] ?? 'skip';
  });
  return map;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LeadImportModal({ onClose, onImported, currentLeadCount }: Props) {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const [activeTab, setActiveTab] = useState<'csv' | 'scrape'>('csv');

  // CSV state
  const [csvHeaders,  setCsvHeaders]  = useState<string[]>([]);
  const [csvRows,     setCsvRows]     = useState<string[][]>([]);
  const [mapping,     setMapping]     = useState<Record<number, string>>({});
  const [importing,   setImporting]   = useState(false);
  const [importProg,  setImportProg]  = useState(0);
  const [isDragging,  setIsDragging]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // AI Lineage Mapping step
  const [showLineageStep,   setShowLineageStep]   = useState(false);
  const [lineageClusters,   setLineageClusters]   = useState<ImportCluster[]>([]);
  const [lineageLoading,    setLineageLoading]    = useState(false);
  const [dismissedClusters, setDismissedClusters] = useState<Set<number>>(new Set());
  const [expandedCluster,   setExpandedCluster]   = useState<number | null>(null);

  // Scrape state
  const [scrapeSearch,   setScrapeSearch]   = useState('');
  const [scrapeData,     setScrapeData]     = useState<ScrapedBizForImport[]>([]);
  const [scrapeLoading,  setScrapeLoading]  = useState(false);
  const [scrapePage,     setScrapePage]     = useState(0);
  const [scrapeSelected, setScrapeSelected] = useState<Set<string>>(new Set());
  const [scrapeTotal,    setScrapeTotal]    = useState(0);
  const PAGE_SIZE = 20;

  const panel   = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const muted   = isDark ? '#64748b' : '#9a7860';
  const accent  = '#f97316';
  const inputBg = isDark ? '#0a1020' : '#fdf6f0';
  const inputSt = {
    width: '100%', padding: '8px 12px', background: inputBg,
    border: `1px solid ${border}`, borderRadius: 8, color: text,
    fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  };

  const isFree  = bizUser.plan === 'free';
  const canImport = !isFree; // basic+ can import
  const remaining = Math.max(0, FREE_LEAD_CAP - currentLeadCount);

  // ── CSV parse ──────────────────────────────────────────────────────────────

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      const raw = e.target?.result as string;
      const { headers, rows } = parseCSV(raw);
      setCsvHeaders(headers);
      setCsvRows(rows);
      setMapping(autoDetectMapping(headers));
    };
    reader.readAsText(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) handleFile(file);
  }, []);

  // ── AI Lineage step — run before final import ──────────────────────────────

  async function handleShowLineageStep() {
    if (!csvRows.length) return;
    const nameCol = Object.entries(mapping).find(([,v]) => v === 'name')?.[0];
    if (nameCol === undefined) return;

    setLineageLoading(true);
    setShowLineageStep(true);

    const rowsToProcess = isFree ? csvRows.slice(0, remaining) : csvRows;
    const rows = rowsToProcess.map(row => {
      const r: { name?: string; phone?: string; email?: string; company?: string } = {};
      Object.entries(mapping).forEach(([ci, field]) => {
        if (field === 'skip') return;
        const val = row[Number(ci)]?.trim();
        if (!val) return;
        if (field === 'name')    r.name    = val;
        if (field === 'phone')   r.phone   = val;
        if (field === 'email')   r.email   = val;
        if (field === 'company') r.company = val;
      });
      return r;
    });

    const clusters = await groupImportRowsByEntity(bizUser.businessId ?? '', rows);
    setLineageClusters(clusters);
    setLineageLoading(false);
  }

  // ── CSV import ─────────────────────────────────────────────────────────────

  async function handleCSVImport() {
    if (!csvRows.length) return;
    setImporting(true);
    const nameCol = Object.entries(mapping).find(([,v]) => v === 'name')?.[0];
    if (nameCol === undefined) { setImporting(false); return; }

    const importedLeads: Lead[] = [];
    const rowsToProcess = isFree ? csvRows.slice(0, remaining) : csvRows;

    // Build row→entity map from non-dismissed clusters
    const rowEntityMap = new Map<number, string | null>(); // rowIndex → entityId to link (null = create new)
    if (showLineageStep) {
      lineageClusters.forEach((cluster, ci) => {
        if (dismissedClusters.has(ci)) return;
        cluster.rowIndexes.forEach(ri => rowEntityMap.set(ri, cluster.entityId));
      });
    }

    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      const leadData: Partial<Lead> = {
        business_id: bizUser.businessId!,
        stage: 'new', priority: 'medium', source: 'csv',
      };
      Object.entries(mapping).forEach(([colIdx, field]) => {
        if (field === 'skip') return;
        const val = row[Number(colIdx)]?.trim();
        if (!val) return;
        if (field === 'deal_value') {
          (leadData as Record<string, unknown>)[field] = Number(val.replace(/[^0-9.]/g, '')) || undefined;
        } else {
          (leadData as Record<string, unknown>)[field] = val;
        }
      });
      if (!leadData.name) continue;
      const created = await insertLead(leadData as Omit<Lead,'id'|'created_at'|'updated_at'>);
      const finalLead = created ?? {
        ...leadData,
        id: `csv-${Date.now()}-${i}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Lead;
      importedLeads.push(finalLead);

      // Link to entity if lineage step ran
      if (showLineageStep && rowEntityMap.has(i) && created) {
        const entityId = rowEntityMap.get(i);
        if (entityId) {
          // Link to existing entity
          await linkLeadToEntity(created.id, entityId);
        } else {
          // Create new entity for this lead
          const newEntity = await createLeadEntity({
            business_id:  bizUser.businessId!,
            entity_type:  'person',
            name:         created.name,
            phone:        created.phone,
            email:        created.email,
            company:      created.company,
          });
          if (newEntity) await linkLeadToEntity(created.id, newEntity.id);
        }
      }

      setImportProg(Math.round(((i + 1) / rowsToProcess.length) * 100));
      await new Promise(r => setTimeout(r, 30)); // brief yield
    }

    onImported(importedLeads);
    setImporting(false);
    onClose();
  }

  // ── Scrape data ────────────────────────────────────────────────────────────

  async function loadScrapedData(page = 0, search = '') {
    setScrapeLoading(true);
    const data = await fetchScrapedForImport(bizUser.businessId ?? '', PAGE_SIZE, page * PAGE_SIZE, search);
    setScrapeData(data);
    setScrapeTotal(data.length < PAGE_SIZE ? page * PAGE_SIZE + data.length : (page + 1) * PAGE_SIZE + 1);
    setScrapeLoading(false);
  }

  function handleScrapedSearch(e: React.FormEvent) {
    e.preventDefault();
    setScrapePage(0);
    loadScrapedData(0, scrapeSearch);
  }

  async function handleScrapeImport() {
    if (!scrapeSelected.size) return;
    setImporting(true);
    const selected = scrapeData.filter(s => scrapeSelected.has(s.id));
    const importedLeads: Lead[] = [];
    for (let i = 0; i < selected.length; i++) {
      const biz = selected[i];
      const created = await insertLead({
        business_id:  bizUser.businessId!,
        name:         biz.name,
        phone:        biz.phone ?? undefined,
        company:      biz.name,
        stage:        'new',
        priority:     'medium',
        source:       'scrape',
        scraped_biz_id: biz.id,
      });
      if (created) importedLeads.push(created);
      else importedLeads.push({
        id: `scrape-${Date.now()}-${i}`,
        business_id: bizUser.businessId!,
        name: biz.name, phone: biz.phone ?? undefined,
        company: biz.name, stage: 'new', priority: 'medium', source: 'scrape',
        scraped_biz_id: biz.id,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      } as Lead);
    }
    onImported(importedLeads);
    setImporting(false);
    onClose();
  }

  // ── CSV template download ──────────────────────────────────────────────────

  function downloadTemplate() {
    const csv = 'Name,Phone,Email,Company,Deal Value,Product Interest,Notes\nRamesh Logistics,9876543210,ramesh@example.com,Ramesh Transport Co.,85000,Monthly supply 50kg rice,High priority';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'leads_template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 580,
        background: panel, borderRadius: 16,
        border: `1px solid ${border}`,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', overflow: 'hidden',
        margin: 16,
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${border}`, flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: text }}>
            📥 Import Leads
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: muted,
            padding: 4, borderRadius: 6, display: 'flex',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Plan gate overlay for free users */}
        {!canImport && (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 6 }}>
              Import requires Basic Plan or higher
            </div>
            <div style={{ fontSize: 12, color: muted, marginBottom: 16 }}>
              Upgrade to import leads via CSV or scrape from our database.
            </div>
            <button onClick={onClose} style={{
              padding: '10px 24px', background: `linear-gradient(135deg, ${accent}, #fb923c)`,
              border: 'none', borderRadius: 8, cursor: 'pointer',
              color: '#fff', fontSize: 13, fontWeight: 700,
            }}>
              Upgrade Plan
            </button>
          </div>
        )}

        {canImport && (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
              {(['csv', 'scrape'] as const).map(t => (
                <button key={t} onClick={() => {
                  setActiveTab(t);
                  if (t === 'scrape' && scrapeData.length === 0) loadScrapedData(0, '');
                }} style={{
                  flex: 1, padding: '10px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t ? 700 : 500,
                  color: activeTab === t ? accent : muted,
                  borderBottom: `2px solid ${activeTab === t ? accent : 'transparent'}`,
                }}>
                  {t === 'csv' ? '📋 CSV Import' : '🔍 Scrape Import'}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

              {/* ── CSV TAB ────────────────────────────────────────────── */}
              {activeTab === 'csv' && (
                <div>
                  {/* Template download */}
                  <button onClick={downloadTemplate} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', background: 'none',
                    border: `1px solid ${border}`, borderRadius: 8,
                    cursor: 'pointer', color: muted, fontSize: 12, marginBottom: 16,
                  }}>
                    <Download size={13} /> Download CSV Template
                  </button>

                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragging ? accent : border}`,
                      borderRadius: 12, padding: '32px 20px',
                      textAlign: 'center', cursor: 'pointer',
                      background: isDragging ? `${accent}11` : (isDark ? '#0a1020' : '#fdf6f0'),
                      marginBottom: 16, transition: 'all 0.15s',
                    }}
                  >
                    <Upload size={24} color={isDragging ? accent : muted} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, color: text, fontWeight: 600 }}>
                      Drop your CSV file here
                    </div>
                    <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>
                      or click to browse — .csv files only
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                  </div>

                  {/* Column mapping */}
                  {csvHeaders.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Map Columns ({csvRows.length} rows detected)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {csvHeaders.map((h, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div style={{ fontSize: 11, color: muted }}>CSV: <strong>{h}</strong></div>
                            <select
                              value={mapping[i] ?? 'skip'}
                              onChange={e => setMapping(prev => ({ ...prev, [i]: e.target.value }))}
                              style={{ ...inputSt }}
                            >
                              {Object.entries(LEAD_FIELD_LABELS).map(([k, l]) => (
                                <option key={k} value={k}>{l}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      {/* Preview */}
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6, textTransform: 'uppercase' }}>Preview (first 3 rows)</div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                            <thead>
                              <tr>
                                {csvHeaders.map((h, i) => (
                                  <th key={i} style={{
                                    padding: '5px 8px', textAlign: 'left', color: muted,
                                    borderBottom: `1px solid ${border}`, whiteSpace: 'nowrap',
                                  }}>
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvRows.slice(0, 3).map((row, ri) => (
                                <tr key={ri}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} style={{
                                      padding: '5px 8px', color: text, borderBottom: `1px solid ${border}`,
                                      maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {importing && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 12, color: muted, marginBottom: 4 }}>Importing… {importProg}%</div>
                          <div style={{ height: 6, background: border, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${importProg}%`, background: accent, borderRadius: 3, transition: 'width 0.2s' }} />
                          </div>
                        </div>
                      )}

                      {/* AI Lineage step indicator */}
                      {showLineageStep && !importing && (
                        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#22c55e22', border: '1px solid #22c55e44', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                          <CheckCircle2 size={14} /> AI Lineage Mapping applied — {lineageClusters.filter((_,i) => !dismissedClusters.has(i)).length} clusters will be linked
                          <button onClick={() => setShowLineageStep(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', fontSize: 11 }}>Redo</button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {!showLineageStep && (
                          <button
                            onClick={handleShowLineageStep}
                            disabled={importing || !Object.values(mapping).includes('name')}
                            style={{
                              flex: 1, padding: '10px', background: isDark ? '#1c2a55' : '#f0f4ff',
                              border: `1px solid ${isDark ? '#3b4fd4' : '#c7d2fe'}`, borderRadius: 8,
                              cursor: !importing && Object.values(mapping).includes('name') ? 'pointer' : 'not-allowed',
                              color: isDark ? '#a5b4fc' : '#4338ca', fontSize: 12, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                          >
                            <GitBranch size={13} /> AI Lineage Map
                          </button>
                        )}
                        <button
                          onClick={handleCSVImport}
                          disabled={importing || !Object.values(mapping).includes('name')}
                          style={{
                            flex: showLineageStep ? 1 : 2, padding: '10px',
                            background: !importing && Object.values(mapping).includes('name')
                              ? `linear-gradient(135deg, ${accent}, #fb923c)` : `${accent}44`,
                            border: 'none', borderRadius: 8,
                            cursor: !importing && Object.values(mapping).includes('name') ? 'pointer' : 'not-allowed',
                            color: '#fff', fontSize: 13, fontWeight: 700,
                            boxShadow: '0 2px 12px rgba(249,115,22,0.3)',
                          }}
                        >
                          {importing ? `Importing… ${importProg}%` : `Import ${isFree ? `up to ${remaining}` : csvRows.length} leads`}
                        </button>
                      </div>

                      {isFree && (
                        <div style={{ fontSize: 11, color: '#f59e0b', textAlign: 'center', marginTop: 6 }}>
                          ⚠️ Free plan: max {FREE_LEAD_CAP} leads. {remaining} slots remaining.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── SCRAPE TAB ─────────────────────────────────────────── */}
              {activeTab === 'scrape' && (
                <div>
                  {/* Search */}
                  <form onSubmit={handleScrapedSearch} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <input
                      value={scrapeSearch}
                      onChange={e => setScrapeSearch(e.target.value)}
                      placeholder="Search by business name…"
                      style={{ ...inputSt, flex: 1 }}
                    />
                    <button type="submit" style={{
                      padding: '8px 16px', background: accent, border: 'none',
                      borderRadius: 8, cursor: 'pointer', color: '#fff',
                      display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
                    }}>
                      <Search size={14} /> Search
                    </button>
                  </form>

                  {scrapeLoading ? (
                    <div style={{ textAlign: 'center', color: muted, padding: 32 }}>Loading businesses…</div>
                  ) : scrapeData.length === 0 ? (
                    <div style={{ textAlign: 'center', color: muted, padding: 32 }}>
                      No scraped businesses found. Try a different search or run the enricher.
                    </div>
                  ) : (
                    <>
                      {/* Select all */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: muted }}>
                          <input
                            type="checkbox"
                            checked={scrapeData.every(s => scrapeSelected.has(s.id))}
                            onChange={e => {
                              setScrapeSelected(e.target.checked ? new Set(scrapeData.map(s => s.id)) : new Set());
                            }}
                          />
                          Select all ({scrapeData.length})
                        </label>
                        <span style={{ fontSize: 11, color: muted }}>{scrapeSelected.size} selected</span>
                      </div>

                      {/* Table */}
                      <div style={{ maxHeight: 280, overflowY: 'auto', border: `1px solid ${border}`, borderRadius: 10 }}>
                        {scrapeData.map(biz => (
                          <label key={biz.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', cursor: 'pointer',
                            borderBottom: `1px solid ${border}`,
                            background: scrapeSelected.has(biz.id) ? `${accent}11` : 'transparent',
                            transition: 'background 0.1s',
                          }}>
                            <input
                              type="checkbox"
                              checked={scrapeSelected.has(biz.id)}
                              onChange={e => {
                                setScrapeSelected(prev => {
                                  const n = new Set(prev);
                                  e.target.checked ? n.add(biz.id) : n.delete(biz.id);
                                  return n;
                                });
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {biz.name}
                              </div>
                              <div style={{ fontSize: 11, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {biz.phone && `📞 ${biz.phone}`}{biz.address && ` · ${biz.address}`}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* Pagination */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                        <button disabled={scrapePage === 0} onClick={() => {
                          const p = scrapePage - 1;
                          setScrapePage(p); loadScrapedData(p, scrapeSearch);
                        }} style={{
                          padding: '6px 12px', background: 'none', border: `1px solid ${border}`,
                          borderRadius: 8, cursor: scrapePage === 0 ? 'not-allowed' : 'pointer',
                          color: muted, opacity: scrapePage === 0 ? 0.4 : 1,
                          display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                        }}>
                          <ChevronLeft size={14} /> Prev
                        </button>
                        <span style={{ fontSize: 12, color: muted }}>Page {scrapePage + 1}</span>
                        <button disabled={scrapeData.length < PAGE_SIZE} onClick={() => {
                          const p = scrapePage + 1;
                          setScrapePage(p); loadScrapedData(p, scrapeSearch);
                        }} style={{
                          padding: '6px 12px', background: 'none', border: `1px solid ${border}`,
                          borderRadius: 8, cursor: scrapeData.length < PAGE_SIZE ? 'not-allowed' : 'pointer',
                          color: muted, opacity: scrapeData.length < PAGE_SIZE ? 0.4 : 1,
                          display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                        }}>
                          Next <ChevronRight size={14} />
                        </button>
                      </div>

                      {/* Import button */}
                      <button onClick={handleScrapeImport} disabled={importing || scrapeSelected.size === 0} style={{
                        width: '100%', padding: '10px', marginTop: 12,
                        background: !importing && scrapeSelected.size > 0
                          ? `linear-gradient(135deg, ${accent}, #fb923c)` : `${accent}44`,
                        border: 'none', borderRadius: 8,
                        cursor: !importing && scrapeSelected.size > 0 ? 'pointer' : 'not-allowed',
                        color: '#fff', fontSize: 13, fontWeight: 700,
                      }}>
                        {importing ? 'Importing…' : `Import Selected (${scrapeSelected.size})`}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── AI LINEAGE MAPPING OVERLAY ──────────────────────────────────────── */}
      {showLineageStep && lineageLoading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: isDark ? '#0e1530' : '#fff', borderRadius: 16, padding: 32,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minWidth: 280,
          }}>
            <Loader size={32} color={accent} style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#18100a', fontSize: 15 }}>
              AI Lineage Matching…
            </div>
            <div style={{ fontSize: 12, color: isDark ? '#64748b' : '#9a7860', textAlign: 'center' }}>
              Scanning historical leads for matching entities<br/>using name, phone, email and company similarity
            </div>
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {showLineageStep && !lineageLoading && lineageClusters.length > 0 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: isDark ? '#0e1530' : '#fff', borderRadius: 16,
            width: '100%', maxWidth: 580, maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#6366f122', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GitBranch size={18} color="#6366f1" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? '#e2e8f0' : '#18100a' }}>
                    AI Lineage Mapping
                  </div>
                  <div style={{ fontSize: 12, color: isDark ? '#64748b' : '#9a7860' }}>
                    {lineageClusters.filter(c => !c.isNew).length} existing entities matched · {lineageClusters.filter(c => c.isNew).length} new entities
                  </div>
                </div>
                <button onClick={() => setShowLineageStep(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} color={isDark ? '#64748b' : '#9a7860'} />
                </button>
              </div>
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#6366f111', border: '1px solid #6366f133', fontSize: 12, color: '#818cf8' }}>
                Review how imported rows will be grouped with historical leads. Dismiss any incorrect matches.
              </div>
            </div>

            {/* Cluster list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lineageClusters.map((cluster, ci) => {
                const dismissed = dismissedClusters.has(ci);
                const expanded  = expandedCluster === ci;
                const confColor = cluster.confidence >= 80 ? '#22c55e' : cluster.confidence >= 60 ? '#f59e0b' : '#64748b';
                return (
                  <div key={ci} style={{
                    borderRadius: 10, border: `1px solid ${dismissed ? border : cluster.isNew ? '#f59e0b44' : '#6366f144'}`,
                    background: dismissed ? (isDark ? '#0a0e1a' : '#f9fafb') : (isDark ? '#111827' : '#fafafe'),
                    opacity: dismissed ? 0.5 : 1, transition: 'all 0.2s',
                  }}>
                    <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Icon */}
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: cluster.isNew ? '#f59e0b22' : '#6366f122',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {cluster.isNew ? <AlertTriangle size={14} color="#f59e0b" /> : <Users size={14} color="#6366f1" />}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#e2e8f0' : '#18100a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cluster.entityName}
                          </span>
                          {!cluster.isNew && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: `${confColor}22`, color: confColor, flexShrink: 0 }}>
                              {cluster.confidence}% match
                            </span>
                          )}
                          {cluster.isNew && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: '#f59e0b22', color: '#f59e0b', flexShrink: 0 }}>
                              NEW
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: isDark ? '#64748b' : '#9a7860', marginTop: 2 }}>
                          {cluster.rowIndexes.length} row{cluster.rowIndexes.length > 1 ? 's' : ''} · {cluster.matchReason}
                          {cluster.entity?.last_stage && ` · Last: ${cluster.entity.last_stage}`}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => setExpandedCluster(expanded ? null : ci)} style={{ padding: '4px 8px', borderRadius: 6, background: 'none', border: `1px solid ${border}`, cursor: 'pointer', fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                          {expanded ? 'Hide' : 'Details'}
                        </button>
                        <button
                          onClick={() => setDismissedClusters(prev => {
                            const next = new Set(prev);
                            dismissed ? next.delete(ci) : next.add(ci);
                            return next;
                          })}
                          style={{ padding: '4px 8px', borderRadius: 6, background: dismissed ? '#22c55e22' : '#ef444422', border: `1px solid ${dismissed ? '#22c55e44' : '#ef444444'}`, cursor: 'pointer', fontSize: 11, color: dismissed ? '#22c55e' : '#ef4444', fontWeight: 600 }}
                        >
                          {dismissed ? '✓ Restore' : '✕ Dismiss'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded: show row details */}
                    {expanded && (
                      <div style={{ padding: '0 14px 12px', borderTop: `1px solid ${border}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#64748b' : '#9a7860', margin: '10px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Rows to be grouped
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {cluster.rowIndexes.map(ri => {
                            const row = csvRows[ri];
                            const vals = Object.entries(mapping)
                              .filter(([,f]) => f !== 'skip')
                              .map(([ci2, field]) => `${LEAD_FIELD_LABELS[field] ?? field}: ${row?.[Number(ci2)] ?? '—'}`)
                              .join(' · ');
                            return (
                              <div key={ri} style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#475569', padding: '4px 8px', borderRadius: 6, background: isDark ? '#0a1020' : '#f8fafc' }}>
                                Row {ri + 1}: {vals}
                              </div>
                            );
                          })}
                        </div>
                        {cluster.entity && (
                          <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: '#6366f111', border: '1px solid #6366f133', fontSize: 11, color: '#818cf8' }}>
                            🔗 Existing entity: <strong>{cluster.entity.name}</strong> · {cluster.entity.total_deals} deal{cluster.entity.total_deals !== 1 ? 's' : ''} · Last stage: {cluster.entity.last_stage ?? 'N/A'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={() => setShowLineageStep(false)} style={{ flex: 1, padding: '10px', background: 'none', border: `1px solid ${border}`, borderRadius: 8, cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b', fontSize: 13, fontWeight: 600 }}>
                ← Back to Mapping
              </button>
              <button
                onClick={() => setShowLineageStep(false)}
                style={{ flex: 2, padding: '10px', background: `linear-gradient(135deg, #6366f1, #818cf8)`, border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }}
              >
                Apply Lineage Mapping ({lineageClusters.length - dismissedClusters.size} clusters)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
