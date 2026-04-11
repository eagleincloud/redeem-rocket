import { motion, AnimatePresence } from 'motion/react';
import { Flame, Gift, Trophy, X, Tag, MapPin, Sparkles, Gavel, Building2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { mockAuctions, mockRequirements } from '../mockData';
import { useSearchCategory } from '../context/SearchCategoryContext';

type OfferCategoryId = 'streak' | 'nearby' | 'custom' | 'auctions' | 'scraped';

const offerCategories: { id: OfferCategoryId; label: string; icon: typeof Flame; path?: string; color: string }[] = [
  { id: 'streak', label: '7 Day Streak', icon: Flame, color: 'bg-orange-500' },
  { id: 'nearby', label: 'Nearby Offer', icon: MapPin, path: '/nearby-deals', color: 'bg-pink-500' },
  { id: 'custom', label: 'Your Custom Offer', icon: Sparkles, path: '/requirements', color: 'bg-purple-500' },
  { id: 'auctions', label: 'Live Auctions', icon: Gavel, path: '/auctions', color: 'bg-red-500' },
  { id: 'scraped', label: 'Scraped Businesses', icon: Building2, path: '/scraped-businesses', color: 'bg-slate-600' },
];

export function GamificationBadge() {
  const navigate = useNavigate();
  const { nearbyOffers, locationScrapedBusinesses } = useSearchCategory();
  const [showCorner, setShowCorner] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [streak] = useState(7);

  const counts = useMemo(() => {
    const nearbyCount = nearbyOffers.length; // geofence-based: offers within user's radius setting
    const auctionsCount = mockAuctions.length;
    const customCount = mockRequirements.length;
    const scrapedCount = locationScrapedBusinesses.length;
    return {
      streak: 1,
      nearby: nearbyCount,
      custom: customCount,
      auctions: auctionsCount,
      scraped: scrapedCount,
    };
  }, [nearbyOffers, locationScrapedBusinesses]);

  const totalOffers = useMemo(
    () => counts.streak + counts.nearby + counts.custom + counts.auctions,
    [counts]
  );

  useEffect(() => {
    const hasSeenReward = sessionStorage.getItem('dailyRewardSeen');
    if (!hasSeenReward) {
      setTimeout(() => setShowReward(true), 2000);
    }
  }, []);

  const handleClaimReward = () => {
    sessionStorage.setItem('dailyRewardSeen', 'true');
    setShowReward(false);
  };

  const handleCategoryClick = (id: OfferCategoryId, path?: string) => {
    setShowCorner(false);
    if (id === 'streak') {
      setShowReward(true);
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <>
      {/* Offers Corner icon - aligned with + FAB (bottom-6), left side */}
      <div className="fixed bottom-6 left-6 z-[1100] flex flex-col items-start gap-2">
        <AnimatePresence>
          {showCorner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="flex flex-col gap-2 p-2 rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-xl"
            >
              {offerCategories.map((cat, i) => {
                const count = counts[cat.id];
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.id, cat.path)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative flex items-center gap-3 w-full min-w-[160px] pr-3 py-2 pl-2 rounded-xl hover:bg-gray-100/80 transition-colors text-left"
                  >
                    <div className={`relative shrink-0 w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon size={20} />
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-gray-900 text-white text-[10px] font-bold rounded-full">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-gray-800 text-sm truncate">{cat.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={() => setShowCorner((v) => !v)}
          initial={{ scale: 0, x: -100 }}
          animate={{ scale: 1, x: 0 }}
          transition={{ delay: 1, type: 'spring', stiffness: 200 }}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 rounded-2xl shadow-lg cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all border-0 flex items-center justify-center relative"
          aria-label="Offers Corner"
        >
          <Tag size={24} className="shrink-0" />
          {totalOffers > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-white text-orange-600 text-xs font-bold rounded-full shadow">
              {totalOffers}
            </span>
          )}
        </motion.button>
      </div>

      {/* Daily Reward Popup (opened from 7 Day Streak in Offers Corner) */}
      <AnimatePresence>
        {showReward && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setShowReward(false)}
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90%] max-w-sm"
            >
              <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1 rounded-3xl">
                <div className="relative bg-white rounded-3xl p-6 text-center">
                  <button
                    onClick={() => setShowReward(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>

                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1, 1.1, 1],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                    className="inline-block mb-4"
                  >
                    <Gift size={64} className="text-purple-600" />
                  </motion.div>

                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Daily Reward!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    You've earned <span className="font-bold text-orange-600">50 points</span> for logging in today!
                  </p>

                  <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Flame className="text-orange-600 shrink-0" size={24} />
                      <span className="text-xl sm:text-2xl font-bold text-orange-900">{streak} Day Streak</span>
                    </div>
                    <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                      {[...Array(7)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            i < streak ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-orange-700 mt-2 text-center">
                      3 more days to unlock <Trophy size={12} className="inline align-middle" /> Premium Bonus!
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClaimReward}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl"
                  >
                    Claim Reward
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
