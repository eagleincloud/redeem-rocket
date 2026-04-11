import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList, Plus, MessageSquare, IndianRupee,
  Clock, ChevronDown, ChevronUp, RefreshCw, CheckCircle,
} from 'lucide-react';
import { mockRequirements } from '../mockData';
import type { CustomerRequirement } from '../types';
import { fetchCustomerRequirements, saveCustomerRequirement } from '../api/supabase-data';
import { hasSupabase } from '../lib/supabase';

const LS_KEY = 'geo-requirements';

// ─── localStorage helpers ─────────────────────────────────────────────────────
function loadLocalReqs(): CustomerRequirement[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return parsed.map((r) => ({
      ...(r as CustomerRequirement),
      createdAt: new Date(r.createdAt as string),
      responses: (r.responses as CustomerRequirement['responses']) ?? [],
    }));
  } catch {
    return [];
  }
}

function saveLocalReqs(reqs: CustomerRequirement[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(reqs));
  } catch {
    // storage full — ignore
  }
}

function mergeReqs(remote: CustomerRequirement[], local: CustomerRequirement[]): CustomerRequirement[] {
  const seen = new Set(remote.map((r) => r.id));
  const localOnly = local.filter((r) => !seen.has(r.id));
  return [...remote, ...localOnly].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CustomerRequirementPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [requirements, setRequirements] = useState<CustomerRequirement[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Home Services');
  const [formBudget, setFormBudget] = useState('');
  const [formUrgency, setFormUrgency] = useState<'low' | 'medium' | 'high'>('medium');

  // ── Load from Supabase + localStorage on mount ──────────────────────────────
  const loadRequirements = async () => {
    setLoading(true);
    try {
      const [remote, local] = await Promise.all([
        fetchCustomerRequirements(),
        Promise.resolve(loadLocalReqs()),
      ]);

      if (remote.length > 0) {
        setRequirements(mergeReqs(remote, local));
        setIsLive(true);
      } else if (local.length > 0) {
        setRequirements(local);
        setIsLive(false);
      } else {
        setRequirements(mockRequirements);
        setIsLive(false);
      }
    } catch {
      const local = loadLocalReqs();
      setRequirements(local.length > 0 ? local : mockRequirements);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequirements(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit a new requirement ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBudget) return;

    const newReq: CustomerRequirement = {
      id: `local-${Date.now()}`,
      customerId: 'user1',
      title: formTitle.trim(),
      description: formDesc.trim(),
      category: formCategory,
      budget: Number(formBudget),
      urgency: formUrgency,
      status: 'open',
      createdAt: new Date(),
      responses: [],
    };

    // Save to Supabase (best-effort)
    if (hasSupabase()) {
      await saveCustomerRequirement({
        userId: 'user1',
        title: newReq.title,
        description: newReq.description,
        category: newReq.category,
        budget: newReq.budget,
        urgency: newReq.urgency,
      });
    }

    // Always persist locally
    const updatedLocal = [newReq, ...loadLocalReqs()];
    saveLocalReqs(updatedLocal);

    // Update state
    setRequirements((prev) => [newReq, ...prev]);

    // Reset form
    setFormTitle('');
    setFormDesc('');
    setFormBudget('');
    setFormUrgency('medium');
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowCreateForm(false);
    }, 1600);
  };

  // ── Accept a quote ──────────────────────────────────────────────────────────
  const handleAcceptQuote = (reqId: string, quoteId: string) => {
    setRequirements((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r;
        const updated = {
          ...r,
          status: 'in_progress' as const,
          responses: (r.responses ?? []).map((res) =>
            res.id === quoteId ? { ...res, accepted: true } : res
          ),
        };
        // Persist update to localStorage
        const localReqs = loadLocalReqs();
        const localIdx = localReqs.findIndex((l) => l.id === reqId);
        if (localIdx >= 0) {
          localReqs[localIdx] = updated;
          saveLocalReqs(localReqs);
        }
        return updated;
      })
    );
  };

  const urgencyColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    low: 'bg-green-100 text-green-700',
  };

  const statusColors = {
    open: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-700',
  };

  return (
    <div
      className="h-full overflow-y-auto pb-24"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <ClipboardList size={32} />
            <div>
              <h1 className="text-3xl font-bold">Requirements</h1>
              <p className="text-green-100 text-sm">Post what you need, get quotes from businesses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadRequirements}
              disabled={loading}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(true)}
              className="bg-white text-green-600 p-3 rounded-full shadow-lg"
            >
              <Plus size={24} />
            </motion.button>
          </div>
        </div>

        {/* Live indicator */}
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span className={`w-2 h-2 rounded-full ${isLive && hasSupabase() ? 'bg-green-300' : 'bg-yellow-300'}`} />
          <span className="text-white/80">
            {isLive && hasSupabase() ? 'Live data from Supabase' : 'Saved locally — connect Supabase to sync'}
          </span>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-5 mt-4 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-2xl p-4">
        <div className="text-sm font-semibold text-teal-800 dark:text-teal-300 mb-1">How it works</div>
        <div className="text-xs text-teal-700 dark:text-teal-400 space-y-0.5">
          <div>1. Post your requirement with a budget</div>
          <div>2. Nearby businesses send you quotes</div>
          <div>3. Accept the best quote and get the service</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-5">
        {[
          { value: requirements.length, label: 'Total', color: 'text-green-600' },
          { value: requirements.filter((r) => r.status === 'open').length, label: 'Open', color: 'text-orange-600' },
          { value: requirements.reduce((s, r) => s + (r.responses?.length ?? 0), 0), label: 'Quotes', color: 'text-blue-600' },
        ].map(({ value, label, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4 shadow-md text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs" style={{ color: 'var(--text2)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Requirements List */}
      {loading && requirements.length === 0 ? (
        <div className="flex items-center justify-center py-16" style={{ color: 'var(--text2)' }}>
          <RefreshCw size={22} className="animate-spin mr-3" />
          Loading requirements…
        </div>
      ) : (
        <div className="px-5 pb-6 space-y-4">
          {requirements.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text2)' }}>
              <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No requirements yet</p>
              <p className="text-sm mt-1">Tap + to post your first requirement</p>
            </div>
          ) : (
            requirements.map((req, index) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-2xl shadow-lg overflow-hidden"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1.5">{req.title}</h3>
                      {req.description && (
                        <p className="text-sm line-clamp-2" style={{ color: 'var(--text2)' }}>
                          {req.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {req.category}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${urgencyColors[req.urgency]}`}>
                          {req.urgency.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[req.status]}`}>
                          {req.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {req.id.startsWith('local-') && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            Saved locally
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--bg)' }}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <IndianRupee size={16} className="text-green-600" />
                        <span className="font-bold text-green-700 text-lg">{req.budget.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center gap-1.5" style={{ color: 'var(--text2)' }}>
                        <Clock size={14} />
                        <span className="text-xs">{new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(req.responses?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                          <MessageSquare size={14} />
                          <span className="text-xs font-semibold">{req.responses!.length} quotes</span>
                        </div>
                      )}
                      {expandedId === req.id
                        ? <ChevronUp size={18} style={{ color: 'var(--text2)' }} />
                        : <ChevronDown size={18} style={{ color: 'var(--text2)' }} />
                      }
                    </div>
                  </div>
                </div>

                {/* Expanded Quotes */}
                <AnimatePresence>
                  {expandedId === req.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <div className="p-5 pt-3 space-y-3">
                        {req.responses && req.responses.length > 0 ? (
                          <>
                            <h4 className="font-semibold text-sm" style={{ color: 'var(--text2)' }}>Quotes received</h4>
                            {req.responses.map((response) => (
                              <div
                                key={response.id}
                                className="rounded-xl p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="font-semibold text-blue-900 dark:text-blue-300">
                                    {response.businessName}
                                  </div>
                                  <div className="text-green-600 font-bold flex items-center gap-0.5">
                                    <IndianRupee size={14} />{response.price.toLocaleString('en-IN')}
                                  </div>
                                </div>
                                <p className="text-sm" style={{ color: 'var(--text2)' }}>{response.message}</p>
                                {req.status === 'open' && (
                                  <button
                                    onClick={() => handleAcceptQuote(req.id, response.id)}
                                    className="mt-3 w-full py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle size={16} /> Accept Quote
                                  </button>
                                )}
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-center py-4 text-sm" style={{ color: 'var(--text2)' }}>
                            No quotes yet. Businesses will respond soon.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Create Requirement Form */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !submitSuccess && setShowCreateForm(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 rounded-t-3xl p-6 z-50 max-h-[90vh] overflow-y-auto shadow-2xl"
              style={{ background: 'var(--card)', color: 'var(--text)' }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {submitSuccess ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">✅</div>
                  <div className="text-xl font-bold text-green-600">Requirement posted!</div>
                  <p className="text-sm mt-2" style={{ color: 'var(--text2)' }}>
                    {hasSupabase() ? 'Saved to Supabase & locally' : 'Saved locally'}
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-6">Post a Requirement</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title *</label>
                      <input
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        type="text"
                        placeholder="e.g., Need AC repair today"
                        className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-transparent"
                        style={{ borderColor: 'var(--border)' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="Describe what you need in detail…"
                        rows={3}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-transparent resize-none"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-transparent"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {[
                          'Home Services', 'Food & Beverage', 'Electronics',
                          'Fashion', 'Health & Beauty', 'Education', 'Transportation', 'Other',
                        ].map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Budget (₹) *</label>
                        <div className="relative">
                          <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            value={formBudget}
                            onChange={(e) => setFormBudget(e.target.value)}
                            type="number"
                            min="1"
                            placeholder="1500"
                            className="w-full pl-9 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-transparent"
                            style={{ borderColor: 'var(--border)' }}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Urgency</label>
                        <select
                          value={formUrgency}
                          onChange={(e) => setFormUrgency(e.target.value as 'low' | 'medium' | 'high')}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-transparent"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl"
                      >
                        Post Requirement
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
