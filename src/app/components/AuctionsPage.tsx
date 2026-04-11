import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gavel, Clock, MapPin, IndianRupee, Trophy, X, History, RefreshCw } from 'lucide-react';
import { mockAuctions } from '../mockData';
import { Auction } from '../types';
import { fetchActiveAuctions } from '../api/supabase-data';
import { hasSupabase } from '../lib/supabase';

const MIN_BID_INCREMENT = 100; // ₹100 minimum increment
const BIDS_KEY = 'geo-auction-bids'; // localStorage key

// ─── Bid history entry ────────────────────────────────────────────────────────
interface BidEntry {
  amount: number;
  timestamp: string; // ISO string
}

function loadBids(): Record<string, BidEntry[]> {
  try {
    const raw = localStorage.getItem(BIDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveBids(bids: Record<string, BidEntry[]>) {
  try {
    localStorage.setItem(BIDS_KEY, JSON.stringify(bids));
  } catch {
    // storage full — ignore
  }
}

function addBidEntry(auctionId: string, amount: number) {
  const all = loadBids();
  const entries = all[auctionId] ?? [];
  entries.unshift({ amount, timestamp: new Date().toISOString() });
  all[auctionId] = entries.slice(0, 50); // cap per auction
  saveBids(all);
}

// ─── Map Supabase AuctionRow → Auction type ───────────────────────────────────
function mapRowToAuction(row: import('../api/supabase-data').AuctionRow): Auction {
  return {
    id: row.id,
    businessId: row.businessId,
    businessName: row.businessName,
    title: row.title,
    description: row.description,
    startingBid: row.startingBid,
    currentBid: row.currentBid,
    endsAt: row.endAt,
    image: row.image,
    totalBids: row.totalBids,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>(mockAuctions);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [allBids, setAllBids] = useState<Record<string, BidEntry[]>>(loadBids);

  // ── Fetch from Supabase on mount ────────────────────────────────────────────
  const loadAuctions = async () => {
    setLoading(true);
    try {
      const rows = await fetchActiveAuctions();
      if (rows.length > 0) {
        // Merge currentBid from localStorage (user's last bid may exceed DB value)
        const stored = loadBids();
        const mapped = rows.map((r) => {
          const auction = mapRowToAuction(r);
          const myBids = stored[auction.id];
          if (myBids && myBids.length > 0 && myBids[0].amount > auction.currentBid) {
            auction.currentBid = myBids[0].amount;
            auction.totalBids = auction.totalBids + myBids.length;
          }
          return auction;
        });
        setAuctions(mapped);
        setIsLive(true);
      } else {
        // Use mockAuctions as demo data
        setAuctions(mockAuctions);
        setIsLive(false);
      }
    } catch {
      setAuctions(mockAuctions);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAuctions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Place a bid ─────────────────────────────────────────────────────────────
  const handlePlaceBid = () => {
    if (!selectedAuction || !bidAmount) return;
    const amount = parseFloat(bidAmount);
    const minRequired = selectedAuction.currentBid + MIN_BID_INCREMENT;
    if (isNaN(amount)) {
      setBidError('Please enter a valid amount');
      return;
    }
    if (amount < minRequired) {
      setBidError(`Minimum bid is ₹${minRequired.toLocaleString('en-IN')} (current + ₹${MIN_BID_INCREMENT})`);
      return;
    }

    // Persist bid to localStorage
    addBidEntry(selectedAuction.id, amount);
    const updatedBids = loadBids();
    setAllBids(updatedBids);

    // Update auction state
    setAuctions((prev) =>
      prev.map((a) =>
        a.id === selectedAuction.id
          ? { ...a, currentBid: amount, totalBids: a.totalBids + 1 }
          : a
      )
    );

    setBidSuccess(`Bid of ₹${amount.toLocaleString('en-IN')} placed! 🎉`);
    setTimeout(() => {
      setBidSuccess('');
      setSelectedAuction(null);
      setBidAmount('');
      setBidError('');
    }, 1800);
  };

  const totalValue = auctions.reduce((sum, a) => sum + a.currentBid, 0);
  const totalBidsPlaced = Object.values(allBids).reduce((s, arr) => s + arr.length, 0);

  return (
    <div
      className="h-full overflow-y-auto pb-24"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Gavel size={32} />
            <h1 className="text-3xl font-bold">Live Auctions</h1>
          </div>
          <button
            onClick={loadAuctions}
            disabled={loading}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-red-100 text-sm">Bid on exclusive deals and win big!</p>

        {/* Live / demo indicator */}
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span className={`w-2 h-2 rounded-full ${isLive && hasSupabase() ? 'bg-green-300' : 'bg-yellow-300'}`} />
          <span className="text-white/80">
            {isLive && hasSupabase() ? 'Live data from Supabase' : 'Demo data — connect Supabase for live auctions'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-5">
        {[
          { value: auctions.length, label: 'Live Now', color: 'text-red-500' },
          { value: auctions.reduce((s, a) => s + a.totalBids, 0), label: 'Total Bids', color: 'text-orange-500' },
          { value: totalBidsPlaced, label: 'My Bids', color: 'text-purple-500' },
        ].map(({ value, label, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 shadow-md text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs" style={{ color: 'var(--text2)' }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* How it works */}
      <div className="mx-5 mb-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={16} className="text-orange-600" />
          <span className="font-semibold text-orange-800 dark:text-orange-400 text-sm">How It Works</span>
        </div>
        <p className="text-xs text-orange-700 dark:text-orange-300">
          Place a bid above the current bid (min +₹{MIN_BID_INCREMENT}). Highest bidder when timer ends wins!
        </p>
      </div>

      {/* My Bid History summary */}
      {totalBidsPlaced > 0 && (
        <div className="mx-5 mb-4 rounded-2xl p-4 shadow border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <History size={15} style={{ color: 'var(--accent)' }} />
            <span className="font-semibold text-sm">My Bid History</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: 'var(--text2)' }}>
                  <th className="text-left pb-1.5 font-medium">Auction</th>
                  <th className="text-right pb-1.5 font-medium">Amount</th>
                  <th className="text-right pb-1.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(allBids).flatMap(([auctionId, entries]) => {
                  const auction = auctions.find((a) => a.id === auctionId);
                  return entries.slice(0, 3).map((entry, i) => (
                    <tr key={`${auctionId}-${i}`} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-1.5 pr-3 truncate max-w-[120px]">{auction?.title ?? auctionId}</td>
                      <td className="py-1.5 text-right font-bold" style={{ color: 'var(--accent)' }}>
                        ₹{entry.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 text-right" style={{ color: 'var(--text2)' }}>
                        {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Auction Cards */}
      {loading && auctions.length === 0 ? (
        <div className="flex items-center justify-center py-16" style={{ color: 'var(--text2)' }}>
          <RefreshCw size={22} className="animate-spin mr-3" />
          Loading auctions…
        </div>
      ) : (
        <div className="px-5 pb-6 space-y-4">
          {auctions.map((auction, index) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              index={index}
              myBids={allBids[auction.id] ?? []}
              onBid={() => {
                setSelectedAuction(auction);
                setBidAmount('');
                setBidError('');
                setBidSuccess('');
              }}
            />
          ))}
        </div>
      )}

      {/* Bid Modal */}
      <AnimatePresence>
        {selectedAuction && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !bidSuccess && setSelectedAuction(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6 w-[90%] max-w-md z-50 shadow-2xl"
              style={{ background: 'var(--card)', color: 'var(--text)' }}
            >
              {bidSuccess ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-4">🎉</div>
                  <div className="text-lg font-bold text-green-600">{bidSuccess}</div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">{selectedAuction.title}</h2>
                    <button
                      onClick={() => setSelectedAuction(null)}
                      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="text-5xl mb-4 text-center">{selectedAuction.image}</div>

                  {/* Bid stats */}
                  <div className="grid grid-cols-2 gap-3 rounded-xl p-4 mb-4" style={{ background: 'var(--bg)' }}>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--text2)' }}>Starting Bid</div>
                      <div className="font-bold flex items-center gap-0.5">
                        <IndianRupee size={14} />{selectedAuction.startingBid.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--text2)' }}>Current Bid</div>
                      <div className="text-xl font-bold text-red-600 flex items-center gap-0.5">
                        <IndianRupee size={16} />{selectedAuction.currentBid.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--text2)' }}>Total Bids</div>
                      <div className="font-bold">{selectedAuction.totalBids}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--text2)' }}>Your Min Bid</div>
                      <div className="font-bold text-green-600 flex items-center gap-0.5">
                        <IndianRupee size={14} />{(selectedAuction.currentBid + MIN_BID_INCREMENT).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Bid input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Your Bid (₹)</label>
                    <div className="relative">
                      <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => { setBidAmount(e.target.value); setBidError(''); }}
                        placeholder={`Min ₹${(selectedAuction.currentBid + MIN_BID_INCREMENT).toLocaleString('en-IN')}`}
                        className={`w-full pl-9 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-transparent ${bidError ? 'border-red-400' : 'border-gray-300'}`}
                      />
                    </div>
                    {bidError && <p className="text-sm text-red-600 mt-1">{bidError}</p>}
                  </div>

                  {/* My previous bids for this auction */}
                  {(allBids[selectedAuction.id]?.length ?? 0) > 0 && (
                    <div className="mb-4 rounded-xl p-3" style={{ background: 'var(--bg)' }}>
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold" style={{ color: 'var(--text2)' }}>
                        <History size={12} /> My bids on this auction
                      </div>
                      <div className="space-y-1">
                        {(allBids[selectedAuction.id] ?? []).slice(0, 5).map((entry, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span style={{ color: 'var(--text2)' }}>
                              {new Date(entry.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                              ₹{entry.amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedAuction(null)}
                      className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePlaceBid}
                      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                    >
                      <Gavel size={18} />Place Bid
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Auction Card ─────────────────────────────────────────────────────────────
function AuctionCard({
  auction,
  index,
  myBids,
  onBid,
}: {
  auction: Auction;
  index: number;
  myBids: BidEntry[];
  onBid: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const update = () => {
      const diff = auction.endsAt.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [auction.endsAt]);

  const myTopBid = myBids.length > 0 ? myBids[0].amount : null;
  const isWinning = myTopBid !== null && myTopBid >= auction.currentBid;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="text-5xl">{auction.image}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg leading-tight">{auction.title}</h3>
            {myBids.length > 0 && (
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${isWinning ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {isWinning ? '🏆 Winning' : '📋 Bidding'}
              </span>
            )}
          </div>
          <p className="text-sm mt-0.5 mb-2" style={{ color: 'var(--text2)' }}>{auction.description}</p>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text2)' }}>
            <MapPin size={13} />
            <span className="truncate">{auction.businessName}</span>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div
        className="rounded-xl p-3 mb-4"
        style={{
          background: timeLeft.expired
            ? 'var(--bg)'
            : 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.12))',
          border: '1px solid',
          borderColor: timeLeft.expired ? 'var(--border)' : 'rgba(239,68,68,0.25)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: timeLeft.expired ? 'var(--text2)' : '#dc2626' }}>
            <Clock size={16} />
            <span className="text-sm font-medium">{timeLeft.expired ? 'Auction ended' : 'Ends in'}</span>
          </div>
          {!timeLeft.expired && (
            <div className="flex gap-1 font-mono font-bold text-red-600">
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>:
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>:
              <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bid Info & Button */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs mb-0.5" style={{ color: 'var(--text2)' }}>Starting · Current Bid</div>
          <div className="text-sm flex items-center gap-0.5" style={{ color: 'var(--text2)' }}>
            <IndianRupee size={12} />{auction.startingBid.toLocaleString('en-IN')}
          </div>
          <div className="text-2xl font-bold text-red-600 flex items-center gap-0.5">
            <IndianRupee size={18} />{auction.currentBid.toLocaleString('en-IN')}
          </div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>{auction.totalBids} bids placed</div>
          {myTopBid !== null && (
            <div className="text-xs mt-0.5 font-semibold" style={{ color: 'var(--accent)' }}>
              Your bid: ₹{myTopBid.toLocaleString('en-IN')}
            </div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBid}
          disabled={timeLeft.expired}
          className="bg-gradient-to-r from-red-500 to-orange-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          <Gavel size={18} />
          {timeLeft.expired ? 'Ended' : 'Bid Now'}
        </motion.button>
      </div>
    </motion.div>
  );
}
