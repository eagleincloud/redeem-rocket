import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle, XCircle, MapPin, Building2, Tag, X, AlertCircle, Eye, EyeOff, RefreshCw, Search, Rocket, Loader2, Send } from 'lucide-react';
import {
  fetchPendingOffers,
  approveOffer,
  rejectOffer,
  fetchAdminBusinesses,
  fetchOnboardingPipeline,
  runEnricherBatch,
  runOutreachBatch,
  type AdminOffer,
  type AdminBusiness,
  type OnboardingPipelineData,
} from '../api/supabase-data';
import { hasSupabase } from '../lib/supabase';
import type { Offer } from '../types';

interface PendingOffer extends Offer {
  businessName: string;
  submittedAt: Date;
}

const MOCK_PENDING: PendingOffer[] = [
  {
    id: 'po1', businessId: 'b1', businessName: 'Urban Coffee House',
    title: '20% OFF on all drinks', description: 'Valid for dine-in only',
    discount: 20, price: 299, expiresAt: new Date(Date.now() + 7 * 86400000),
    category: 'Food & Beverage', status: 'pending_approval',
    submittedAt: new Date(Date.now() - 2 * 3600000),
  },
  {
    id: 'po2', businessId: 'b2', businessName: 'Fashion Boutique',
    title: 'Buy 1 Get 1 Free', description: 'On selected summer items',
    discount: 50, price: 1999, expiresAt: new Date(Date.now() + 3 * 86400000),
    category: 'Fashion', status: 'pending_approval',
    submittedAt: new Date(Date.now() - 5 * 3600000),
  },
  {
    id: 'po3', businessId: 'b3', businessName: 'Fitness Zone',
    title: 'Free trial week', description: 'New members only – 7-day free access',
    discount: 100, price: 0, expiresAt: new Date(Date.now() + 14 * 86400000),
    category: 'Health & Fitness', status: 'pending_approval',
    submittedAt: new Date(Date.now() - 3600000),
  },
];

const MOCK_BUSINESSES: AdminBusiness[] = [
  { id: 'b1', name: 'Urban Coffee House', category: 'Food & Beverage', address: '123 Main St', is_claimed: true,  rating: 4.5 },
  { id: 'b2', name: 'Fashion Boutique',   category: 'Fashion',          address: '45 Style Ave', is_claimed: true,  rating: 4.2 },
  { id: 'b3', name: 'Fitness Zone',       category: 'Health & Fitness', address: '88 Gym Rd',   is_claimed: true,  rating: 4.7 },
  { id: 'b4', name: 'Wellness Spa',       category: 'Health & Beauty',  address: '321 Relax St', is_claimed: false, rating: 4.8 },
  { id: 'b5', name: 'Gourmet Pizza',      category: 'Food & Beverage',  address: '555 Pizza Ln', is_claimed: false, rating: 4.4 },
  { id: 'b6', name: 'Fresh Mart',         category: 'Grocery',          address: '78 Market Rd', is_claimed: false, rating: 4.0 },
  { id: 'b7', name: 'City Pharmacy',      category: 'Pharmacy',         address: '12 Health Ave', is_claimed: true, rating: 4.3 },
];

type Tab = 'offers' | 'businesses' | 'map' | 'pipeline';

export function AdminPanel() {
  const [activeTab, setActiveTab]             = useState<Tab>('offers');
  const [pendingOffers, setPendingOffers]     = useState<(PendingOffer | AdminOffer)[]>([]);
  const [processed, setProcessed]             = useState<{ offer: PendingOffer | AdminOffer; decision: 'approved' | 'rejected'; reason?: string }[]>([]);
  const [businesses, setBusinesses]           = useState<AdminBusiness[]>([]);
  const [rejectTarget, setRejectTarget]         = useState<string | null>(null);
  const [rejectionReason, setRejectionReason]   = useState('');
  const [showUnclaimed, setShowUnclaimed]       = useState(true);
  const [loading, setLoading]                   = useState(false);
  const [bizSearch, setBizSearch]               = useState('');
  const [pipeline, setPipeline]                 = useState<OnboardingPipelineData>({ counts: {}, recent: [] });
  const [pipelineLoading, setPipelineLoading]   = useState(false);
  const [enricherRunning, setEnricherRunning]   = useState(false);
  const [outreachRunning, setOutreachRunning]   = useState(false);
  const [pipelineMsg, setPipelineMsg]           = useState('');
  const usingSupabase = hasSupabase();

  const loadData = async () => {
    setLoading(true);
    try {
      if (usingSupabase) {
        const [offers, biz] = await Promise.all([fetchPendingOffers(), fetchAdminBusinesses()]);
        setPendingOffers(offers.length > 0 ? offers : MOCK_PENDING);
        setBusinesses(biz.length   > 0 ? biz   : MOCK_BUSINESSES);
      } else {
        setPendingOffers(MOCK_PENDING);
        setBusinesses(MOCK_BUSINESSES);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPipeline = async () => {
    if (!usingSupabase) return;
    setPipelineLoading(true);
    const data = await fetchOnboardingPipeline();
    setPipeline(data);
    setPipelineLoading(false);
  };

  const handleRunEnricher = async () => {
    setEnricherRunning(true);
    setPipelineMsg('');
    const result = await runEnricherBatch(50);
    setPipelineMsg(`✅ Enriched ${result.enriched} businesses, skipped ${result.skipped}`);
    setEnricherRunning(false);
    loadPipeline();
  };

  const handleRunOutreach = async () => {
    setOutreachRunning(true);
    setPipelineMsg('');
    const result = await runOutreachBatch(20, 'whatsapp');
    setPipelineMsg(`✅ Sent ${result.sent} invitations, ${result.failed} failed`);
    setOutreachRunning(false);
    loadPipeline();
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (activeTab === 'pipeline') loadPipeline(); }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async (offerId: string) => {
    const offer = pendingOffers.find((o) => o.id === offerId);
    if (!offer) return;
    if (usingSupabase) await approveOffer(offerId);
    setProcessed((p) => [...p, { offer, decision: 'approved' }]);
    setPendingOffers((p) => p.filter((o) => o.id !== offerId));
  };

  const handleReject = async (offerId: string) => {
    const offer = pendingOffers.find((o) => o.id === offerId);
    if (!offer) return;
    const reason = rejectionReason || 'Does not meet platform guidelines.';
    if (usingSupabase) await rejectOffer(offerId, reason);
    setProcessed((p) => [...p, { offer, decision: 'rejected', reason }]);
    setPendingOffers((p) => p.filter((o) => o.id !== offerId));
    setRejectTarget(null);
    setRejectionReason('');
  };

  const filteredBiz = businesses.filter(
    (b) => !bizSearch || b.name.toLowerCase().includes(bizSearch.toLowerCase()) || b.category.toLowerCase().includes(bizSearch.toLowerCase())
  );
  const claimedCount   = businesses.filter((b) =>  b.is_claimed).length;
  const unclaimedCount = businesses.filter((b) => !b.is_claimed).length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'offers',     label: 'Offers',     icon: <Tag      size={16} />, badge: pendingOffers.length || undefined },
    { id: 'businesses', label: 'Businesses', icon: <Building2 size={16} /> },
    { id: 'map',        label: 'Map Config', icon: <MapPin   size={16} /> },
    { id: 'pipeline',   label: 'Onboarding', icon: <Rocket   size={16} /> },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Shield size={28} />
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-gray-300 text-xs">
                {usingSupabase ? '🟢 Live data from Supabase' : '🟡 Using demo data (Supabase not connected)'}
              </p>
            </div>
          </div>
          <button onClick={loadData} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" title="Refresh">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <div className="text-xl font-bold text-yellow-300">{pendingOffers.length}</div>
            <div className="text-[10px] text-gray-300">Pending</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <div className="text-xl font-bold text-green-300">{processed.filter((p) => p.decision === 'approved').length}</div>
            <div className="text-[10px] text-gray-300">Approved</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <div className="text-xl font-bold text-blue-300">{claimedCount}</div>
            <div className="text-[10px] text-gray-300">Claimed Biz</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center">
            <div className="text-xl font-bold text-gray-300">{unclaimedCount}</div>
            <div className="text-[10px] text-gray-300">Unclaimed</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium relative transition-colors ${
              activeTab === tab.id ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}{tab.label}
            {tab.badge ? (
              <span className="absolute top-2 right-3 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Tab: Offer Approval ───────────────────────────────────────────────── */}
      {activeTab === 'offers' && (
        <div className="p-4 space-y-4">
          {loading && (
            <div className="text-center py-8 text-gray-400">
              <RefreshCw size={32} className="mx-auto mb-2 animate-spin text-gray-300" />
              Loading offers…
            </div>
          )}

          {!loading && pendingOffers.length === 0 && processed.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle size={48} className="mx-auto mb-3 text-green-300" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm mt-1">No pending offers.</p>
            </div>
          )}

          {pendingOffers.length > 0 && (
            <>
              <h2 className="font-bold text-gray-700 text-xs uppercase tracking-wider">
                Pending Approval ({pendingOffers.length})
              </h2>
              {/* Pending Offers Table */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                      <th className="text-left px-4 py-3">Offer</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Business</th>
                      <th className="text-center px-3 py-3">Disc.</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingOffers.map((offer) => (
                      <motion.tr
                        key={offer.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 leading-tight">{offer.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[140px]">{(offer as PendingOffer).description}</div>
                          <div className="text-xs text-blue-500 sm:hidden mt-0.5">{(offer as PendingOffer).businessName}</div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="font-medium text-blue-700">{(offer as PendingOffer).businessName}</div>
                          <div className="text-xs text-gray-400">{offer.category}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
                            {offer.discount}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(offer.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                            >
                              <CheckCircle size={13} />
                              Approve
                            </button>
                            <button
                              onClick={() => { setRejectTarget(offer.id); setRejectionReason(''); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                            >
                              <XCircle size={13} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {processed.length > 0 && (
            <div className="mt-4">
              <h2 className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">
                Recently Processed ({processed.length})
              </h2>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                      <th className="text-left px-4 py-2">Offer</th>
                      <th className="text-left px-4 py-2 hidden sm:table-cell">Business</th>
                      <th className="text-center px-3 py-2">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {processed.map(({ offer, decision, reason }) => (
                      <tr key={offer.id + '-p'} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-gray-900 leading-tight">{offer.title}</div>
                          {reason && <div className="text-xs text-red-600 mt-0.5">Reason: {reason}</div>}
                        </td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <span className="text-gray-600">{(offer as PendingOffer).businessName}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            decision === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {decision === 'approved' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                            {decision === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Businesses ──────────────────────────────────────────────────── */}
      {activeTab === 'businesses' && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">
              Businesses
              <span className="ml-2 text-xs font-normal text-gray-500">
                {claimedCount} claimed · {unclaimedCount} unclaimed
              </span>
            </h2>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={bizSearch}
              onChange={(e) => setBizSearch(e.target.value)}
              placeholder="Search by name or category…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
            />
          </div>

          {/* Businesses Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-4 py-3">Business</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Address</th>
                  <th className="text-center px-3 py-3">Rating</th>
                  <th className="text-center px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBiz.map((biz) => (
                  <tr key={biz.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Building2 size={14} className="text-gray-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 leading-tight">{biz.name}</div>
                          <div className="text-xs text-gray-400">{biz.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-500 text-xs">{biz.address}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-gray-700 font-medium">⭐ {biz.rating}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        biz.is_claimed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {biz.is_claimed ? 'Claimed' : 'Unclaimed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBiz.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No businesses found.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Map Config ───────────────────────────────────────────────────── */}
      {activeTab === 'map' && (
        <div className="p-4 space-y-4">
          <h2 className="font-bold text-gray-700">Map Configuration</h2>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                {showUnclaimed ? <Eye size={20} className="text-blue-500 mt-0.5 shrink-0" /> : <EyeOff size={20} className="text-gray-400 mt-0.5 shrink-0" />}
                <div>
                  <div className="font-semibold text-gray-900">Show Unclaimed Businesses</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    Display unclaimed businesses on the map as grey pins for customers to discover.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowUnclaimed((v) => !v)}
                className={`relative shrink-0 ml-4 w-14 h-7 rounded-full transition-colors ${showUnclaimed ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${showUnclaimed ? 'translate-x-7' : ''}`} />
              </button>
            </div>
            <div className={`mt-3 px-3 py-2 rounded-xl text-sm font-medium ${showUnclaimed ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'}`}>
              {showUnclaimed ? '✓ Unclaimed businesses are visible on customer map' : '✗ Only claimed businesses shown'}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-green-500 mt-0.5 shrink-0" />
              <div className="w-full">
                <div className="font-semibold text-gray-900 mb-2">Database Summary</div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-500">Total businesses</td>
                      <td className="py-2 text-right font-semibold">{businesses.length}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-500">Claimed</td>
                      <td className="py-2 text-right font-semibold text-green-600">{claimedCount}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-500">Unclaimed</td>
                      <td className="py-2 text-right font-semibold text-gray-500">{unclaimedCount}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-500">Data source</td>
                      <td className="py-2 text-right font-semibold">
                        {usingSupabase ? <span className="text-green-600">Supabase</span> : <span className="text-yellow-600">Demo data</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">Map settings affect all users immediately after saving.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Onboarding Pipeline ─────────────────────────────────────────── */}
      {activeTab === 'pipeline' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-700">Auto-Onboarding Pipeline</h2>
            <button onClick={loadPipeline} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors" title="Refresh">
              <RefreshCw size={15} className={pipelineLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Funnel Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'raw',           label: 'Raw',           color: 'bg-gray-100 text-gray-600' },
              { key: 'enriched',      label: 'Enriched',      color: 'bg-blue-100 text-blue-700' },
              { key: 'outreach_sent', label: 'Outreach Sent', color: 'bg-yellow-100 text-yellow-700' },
              { key: 'claimed',       label: 'Claimed ✓',     color: 'bg-green-100 text-green-700' },
            ].map(({ key, label, color }) => {
              const total = Object.values(pipeline.counts).reduce((a, b) => a + b, 0);
              const count = pipeline.counts[key] ?? 0;
              const pct   = total > 0 && key === 'claimed' ? ((count / total) * 100).toFixed(1) : null;
              return (
                <div key={key} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                  <div className="text-2xl font-bold text-gray-900">{count.toLocaleString()}</div>
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color} inline-block mt-1`}>
                    {label}
                  </div>
                  {pct && <div className="text-xs text-gray-400 mt-1">{pct}% conv.</div>}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          {usingSupabase ? (
            <div className="flex gap-3">
              <button
                onClick={handleRunEnricher}
                disabled={enricherRunning}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {enricherRunning ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                Run Enricher (50)
              </button>
              <button
                onClick={handleRunOutreach}
                disabled={outreachRunning}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {outreachRunning ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Send Outreach (20)
              </button>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
              ⚠️ Connect Supabase to use the onboarding pipeline.
            </div>
          )}

          {/* Status message */}
          {pipelineMsg && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
              {pipelineMsg}
            </div>
          )}

          {/* Recent records table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recent Records ({pipeline.recent.length})
              </span>
            </div>
            {pipelineLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Loader2 size={24} className="mx-auto mb-2 animate-spin text-gray-300" />
                Loading pipeline…
              </div>
            ) : pipeline.recent.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No scraped businesses found. Add records to the <code className="bg-gray-100 px-1 rounded">scraped_businesses</code> table to begin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                      <th className="text-left px-4 py-2.5">Business</th>
                      <th className="text-left px-4 py-2.5 hidden md:table-cell">Category</th>
                      <th className="text-center px-3 py-2.5">Status</th>
                      <th className="text-right px-4 py-2.5 hidden sm:table-cell">Last Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pipeline.recent.map((rec) => {
                      const lastDate = rec.outreach_sent_at ?? rec.enriched_at;
                      const lastStr = lastDate
                        ? new Date(lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : '—';
                      const statusColors: Record<string, string> = {
                        raw:           'bg-gray-100 text-gray-600',
                        enriched:      'bg-blue-100 text-blue-700',
                        outreach_sent: 'bg-yellow-100 text-yellow-700',
                        claimed:       'bg-green-100 text-green-700',
                        rejected:      'bg-red-100 text-red-600',
                      };
                      return (
                        <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 leading-tight truncate max-w-[180px]">{rec.name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[180px]">{rec.address}</div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                            {rec.category ?? '—'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[rec.enrichment_status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {rec.enrichment_status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell text-xs text-gray-400">
                            {lastStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRejectTarget(null)} className="fixed inset-0 bg-black/50 z-40" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-[90%] max-w-md z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">Reject Offer</h3>
                <button onClick={() => setRejectTarget(null)} className="p-1.5 rounded-full hover:bg-gray-100"><X size={18} /></button>
              </div>
              <p className="text-sm text-gray-600 mb-4">Provide a reason so the merchant can fix and resubmit.</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g., Missing terms and conditions…"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-400 text-sm"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setRejectTarget(null)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-sm">Cancel</button>
                <button onClick={() => rejectTarget && handleReject(rejectTarget)} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 flex items-center justify-center gap-2">
                  <XCircle size={15} />Confirm Reject
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
