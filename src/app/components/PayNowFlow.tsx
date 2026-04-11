import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  IndianRupee,
  Copy,
  Check,
  Smartphone,
  Banknote,
  Upload,
  ImageIcon,
  CheckCircle2,
  Store,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSearchCategory } from '../context/SearchCategoryContext';
import { submitPayment, uploadBillImage } from '../api/payment-submissions';
import { notifyPaymentSubmitted, notifyBusinessNewPayment, getCustomerRecipient } from '../../services/notificationService';
import type { Business } from '../types';

// ── Types ───────────────────────────────────────────────────────────────────

type PayMethod = 'upi' | 'cash';

type Step =
  | 'select'    // 1: choose business (skipped when pre-filled)
  | 'amount'    // 2: enter amount
  | 'method'    // 3: choose payment method
  | 'bill'      // 4: upload bill photo
  | 'confirm'   // 5: summary
  | 'success';  // 6: done

interface Props {
  preFilled?: Business | null;
  onClose: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getUserId(): string {
  try {
    const u = localStorage.getItem('user');
    if (u) return JSON.parse(u).id ?? 'anon';
  } catch { /* empty */ }
  return 'anon';
}

// ── Progress bar ────────────────────────────────────────────────────────────

const STEPS: Step[] = ['amount', 'method', 'bill', 'confirm', 'success'];
function progressIndex(step: Step): number {
  return Math.max(0, STEPS.indexOf(step));
}

// ── Component ────────────────────────────────────────────────────────────────

export function PayNowFlow({ preFilled, onClose }: Props) {
  const { locationScrapedBusinesses } = useSearchCategory();

  const [step, setStep] = useState<Step>(preFilled ? 'amount' : 'select');
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(preFilled ?? null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('upi');
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const cashbackRate = 5; // default 5%
  const parsedAmount = parseFloat(amount) || 0;
  const estimatedCashback = parseFloat(((parsedAmount * cashbackRate) / 100).toFixed(2));

  // Reset scroll to top whenever the step changes
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  // ── Biz search list ──────────────────────────────────────────────────────

  const filteredBizList = locationScrapedBusinesses.filter((b) =>
    b.name.toLowerCase().includes(searchQ.toLowerCase())
  ).slice(0, 30);

  // ── Bill upload ──────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBillFile(f);
    setBillPreview(URL.createObjectURL(f));
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!selectedBiz || parsedAmount <= 0) return;
    setSubmitting(true);
    try {
      const userId = getUserId();
      let bill_url: string | null = null;
      if (billFile) {
        bill_url = await uploadBillImage(billFile, userId);
      }
      const result = await submitPayment({
        user_id: userId,
        business_id: selectedBiz.id,
        business_name: selectedBiz.name,
        amount: parsedAmount,
        payment_method: method,
        bill_url,
        cashback_rate: cashbackRate,
      });
      const sid = result?.id ?? `local-${Date.now()}`;
      setSubmissionId(sid);
      setStep('success');

      // ── Fire notifications (non-blocking) ───────────────────────────────
      const customer   = getCustomerRecipient();
      const customerId = userId !== 'anon' ? userId : undefined;
      const cashback   = parseFloat(((parsedAmount * cashbackRate) / 100).toFixed(2));

      // 1. Notify the customer on all channels (email + SMS + WhatsApp + in-app)
      notifyPaymentSubmitted({
        customer,
        customerId,
        businessName: selectedBiz.name,
        amount: parsedAmount,
        method,
        cashback,
        submissionId: sid,
      }).catch(() => {});

      // 2. Notify the business owner (fetch their contact from supabase)
      import('../../app/lib/supabase').then(({ supabase }) => {
        if (!supabase) return;
        supabase
          .from('businesses')
          .select('owner_phone, owner_email, name')
          .eq('id', selectedBiz.id)
          .single()
          .then(({ data: biz }) => {
            if (!biz) return;
            notifyBusinessNewPayment({
              business: {
                name:  biz.name,
                email: biz.owner_email ?? undefined,
                phone: biz.owner_phone ?? undefined,
              },
              businessId:    selectedBiz.id,
              customerName:  customer.name,
              amount:        parsedAmount,
              method,
              submissionId:  sid,
            }).catch(() => {});
          });
      }).catch(() => {});
    } catch (err) {
      console.error(err);
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedBiz, parsedAmount, method, billFile]);

  // ── UPI copy ─────────────────────────────────────────────────────────────

  const upiId = (selectedBiz as unknown as { upi_id?: string })?.upi_id ?? null;

  const copyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId).catch(() => {});
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // ── Content per step ─────────────────────────────────────────────────────

  const stepContent = () => {
    switch (step) {
      case 'select':
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">Search for the business you want to pay</p>
            <input
              type="text"
              placeholder="Search businesses…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              autoFocus
            />
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100">
              {filteredBizList.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-6">No businesses found</p>
              )}
              {filteredBizList.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { setSelectedBiz(b); setStep('amount'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Store size={16} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{b.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{b.category}</p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-slate-300 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        );

      case 'amount':
        return (
          <div className="flex flex-col gap-4">
            {selectedBiz && (
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Store size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{selectedBiz.name}</p>
                  <p className="text-[11px] text-slate-400">{selectedBiz.category}</p>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Amount Paid (₹)
              </label>
              <div className="relative">
                <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  autoFocus
                />
              </div>
            </div>
            {parsedAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-xs text-emerald-700 font-semibold">Estimated Cashback</p>
                  <p className="text-[11px] text-emerald-500">{cashbackRate}% of ₹{parsedAmount.toLocaleString()}</p>
                </div>
                <p className="text-xl font-black text-emerald-600">
                  ₹{estimatedCashback.toLocaleString()}
                </p>
              </motion.div>
            )}
          </div>
        );

      case 'method':
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">How did you pay?</p>

            {/* UPI Option */}
            <button
              type="button"
              onClick={() => setMethod('upi')}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                method === 'upi'
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${method === 'upi' ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                <Smartphone size={18} className={method === 'upi' ? 'text-white' : 'text-slate-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">UPI / GPay / PhonePe</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Paid digitally via any UPI app</p>
                {method === 'upi' && upiId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-emerald-200"
                  >
                    <p className="text-xs font-mono text-slate-700 flex-1 truncate">{upiId}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); copyUpi(); }}
                      className="shrink-0 text-emerald-600"
                    >
                      {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </motion.div>
                )}
                {method === 'upi' && upiId && (
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(selectedBiz?.name ?? '')}&am=${parsedAmount}&cu=INR`}
                    className="inline-block mt-2 text-[11px] text-emerald-600 font-semibold underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open in UPI app →
                  </a>
                )}
                {method === 'upi' && !upiId && (
                  <p className="text-[11px] text-slate-400 mt-1.5 italic">UPI ID not available for this business</p>
                )}
              </div>
              {method === 'upi' && (
                <Check size={18} className="text-emerald-500 shrink-0 mt-1" />
              )}
            </button>

            {/* Cash Option */}
            <button
              type="button"
              onClick={() => setMethod('cash')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                method === 'cash'
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${method === 'cash' ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                <Banknote size={18} className={method === 'cash' ? 'text-white' : 'text-slate-500'} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">Cash</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Paid in physical cash</p>
              </div>
              {method === 'cash' && (
                <Check size={18} className="text-emerald-500 shrink-0" />
              )}
            </button>
          </div>
        );

      case 'bill':
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              Upload a photo of your receipt or bill. This helps verify your payment and process cashback faster.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {billPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                <img src={billPreview} alt="Bill" className="w-full max-h-52 object-contain bg-slate-50" />
                <button
                  type="button"
                  onClick={() => { setBillFile(null); setBillPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full py-10 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center gap-2 hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Upload size={22} className="text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Tap to upload bill photo</p>
                <p className="text-[11px] text-slate-400">JPG, PNG, HEIC accepted</p>
              </button>
            )}
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <ImageIcon size={12} />
              <span>Optional but recommended — speeds up cashback approval</span>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">Review your payment details</p>
            <div className="bg-slate-50 rounded-2xl divide-y divide-slate-100 overflow-hidden">
              <SummaryRow label="Business" value={selectedBiz?.name ?? '—'} />
              <SummaryRow label="Amount" value={`₹${parsedAmount.toLocaleString()}`} valueClass="font-black text-gray-900" />
              <SummaryRow label="Method" value={method === 'upi' ? 'UPI / Digital' : 'Cash'} />
              <SummaryRow label="Bill" value={billFile ? '📷 Uploaded' : 'Not uploaded'} />
              <SummaryRow
                label="Est. Cashback"
                value={`₹${estimatedCashback.toLocaleString()}`}
                valueClass="font-bold text-emerald-600"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Cashback will be credited after the business approves your payment.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 260, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"
            >
              <CheckCircle2 size={42} className="text-emerald-500" />
            </motion.div>
            <div>
              <h3 className="text-xl font-black text-gray-900">Payment Submitted!</h3>
              <p className="text-sm text-slate-500 mt-1">
                Your payment is under review. Cashback will be credited once approved.
              </p>
            </div>
            <div className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-left">
              <p className="text-[11px] text-emerald-600 font-semibold mb-1">Estimated Cashback</p>
              <p className="text-2xl font-black text-emerald-600">₹{estimatedCashback.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-500 mt-0.5">Pending business approval</p>
            </div>
            {submissionId && (
              <p className="text-[10px] text-slate-400 font-mono">
                Ref: {submissionId.slice(0, 18)}…
              </p>
            )}
          </div>
        );
    }
  };

  // ── Next / back / actions ─────────────────────────────────────────────────

  const canNext = () => {
    switch (step) {
      case 'select': return !!selectedBiz;
      case 'amount': return parsedAmount > 0;
      case 'method': return true;
      case 'bill':   return true;
      case 'confirm': return true;
      default: return false;
    }
  };

  const nextLabel = () => {
    if (step === 'confirm') return submitting ? 'Submitting…' : 'Submit Payment';
    if (step === 'bill') return billFile ? 'Next' : 'Skip & Continue';
    return 'Next';
  };

  const handleNext = async () => {
    switch (step) {
      case 'amount':  setStep('method');  break;
      case 'method':  setStep('bill');    break;
      case 'bill':    setStep('confirm'); break;
      case 'confirm': await handleSubmit(); break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'amount':  preFilled ? onClose() : setStep('select'); break;
      case 'method':  setStep('amount');  break;
      case 'bill':    setStep('method');  break;
      case 'confirm': setStep('bill');    break;
    }
  };

  const totalSteps = 4;
  const currentStepNum = progressIndex(step);

  // ── Render ────────────────────────────────────────────────────────────────

  const title: Record<Step, string> = {
    select:  'Select Business',
    amount:  'Enter Amount',
    method:  'Payment Method',
    bill:    'Upload Bill',
    confirm: 'Confirm Payment',
    success: 'All Done!',
  };

  const content = (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="pn-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={step !== 'success' ? onClose : undefined}
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
        style={{ zIndex: 10000 }}
        aria-hidden
      />

      {/* Sheet */}
      <motion.div
        key="pn-sheet"
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '60%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
        className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[420px] rounded-t-3xl bg-white shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh', zIndex: 10001 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center px-5 pb-3 pt-1 shrink-0 gap-3">
          {step !== 'success' && step !== 'select' && (
            <button
              type="button"
              onClick={handleBack}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              aria-label="Back"
            >
              <ChevronLeft size={16} className="text-slate-600" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-base leading-tight">{title[step]}</h2>
            {step !== 'success' && step !== 'select' && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Step {currentStepNum + 1} of {totalSteps}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            aria-label="Close"
          >
            <X size={16} className="text-slate-600" />
          </button>
        </div>

        {/* Progress bar (shown on steps 1-4) */}
        {step !== 'success' && step !== 'select' && (
          <div className="px-5 pb-3 shrink-0">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-emerald-400"
                animate={{ width: `${((currentStepNum + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              />
            </div>
          </div>
        )}

        {/* Scrollable body */}
        <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto px-5 pb-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18 }}
            >
              {stepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer CTA */}
        <div className="px-5 pb-6 pt-3 shrink-0">
          {step === 'success' ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
            >
              Done
            </button>
          ) : step !== 'select' ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canNext() || submitting}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
              style={{ background: canNext() ? 'linear-gradient(135deg,#10b981,#059669)' : undefined, backgroundColor: canNext() ? undefined : '#94a3b8' }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {nextLabel()}
              {!submitting && step !== 'confirm' && <ChevronRight size={16} />}
            </button>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}

// ── Summary row ──────────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  valueClass = 'text-gray-900',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}
