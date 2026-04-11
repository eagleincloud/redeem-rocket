import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { MapPin, Star, Clock, List, Map as MapIcon } from 'lucide-react';
import { useSearchCategory } from '../context/SearchCategoryContext';

type SortOption = 'distance' | 'discount' | 'expiring' | 'trending';

export function NearbyDealsPage() {
  const navigate = useNavigate();
  const { locationBusinesses } = useSearchCategory();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<SortOption>('distance');

  const sortedDeals = useMemo(() => {
    const allDeals = locationBusinesses.flatMap(business =>
      business.offers.map(offer => ({ ...offer, business }))
    );

    switch (sortBy) {
      case 'discount':
        return allDeals.sort((a, b) => b.discount - a.discount);
      case 'expiring':
        return allDeals.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
      case 'trending':
        return allDeals.filter(d => d.isFlashDeal).concat(allDeals.filter(d => !d.isFlashDeal));
        default:
        return allDeals;
    }
  }, [sortBy, locationBusinesses]);

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Page title and view toggle - global header has search/categories */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nearby Deals</h1>
          <p className="text-gray-500 text-sm">Best offers around you</p>
        </div>
        <div className="flex gap-2 bg-gray-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-pink-600 shadow' : 'text-gray-600'
              }`}
              aria-label="List view"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => {
                setViewMode('map');
                navigate('/');
              }}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'map' ? 'bg-white text-pink-600 shadow' : 'text-gray-600'
              }`}
              aria-label="View on map"
            >
              <MapIcon size={20} />
            </button>
          </div>
      </div>

      {/* Sort Options */}
      <div className="px-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { value: 'distance', label: 'Nearest' },
          { value: 'discount', label: 'Highest Discount' },
          { value: 'expiring', label: 'Expiring Soon' },
          { value: 'trending', label: 'Trending' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setSortBy(option.value as SortOption)}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              sortBy === option.value
                ? 'bg-pink-500 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Stats - aligned grid */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-md text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold text-pink-600">{sortedDeals.length}</div>
            <div className="text-xs text-gray-600 mt-0.5">Active Deals</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold text-orange-600">
              {sortedDeals.filter(d => d.isFlashDeal).length}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">Flash Deals</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center flex flex-col items-center justify-center min-h-[80px]">
            <div className="text-2xl font-bold text-purple-600">
              {sortedDeals.length ? Math.max(...sortedDeals.map(d => d.discount)) : 0}%
            </div>
            <div className="text-xs text-gray-600 mt-0.5">Max Discount</div>
          </div>
        </div>
      </div>

      {/* Deals List - aligned offer cards */}
      <div className="px-6 pb-6 space-y-4">
        {sortedDeals.map((deal, index) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
          >
            <div className="p-5">
              {/* Card header - aligned row */}
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl shrink-0">{deal.business.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-lg mb-0.5 truncate">{deal.business.name}</h3>
                      <p className="text-sm text-gray-600">{deal.business.category}</p>
                    </div>
                    {deal.isFlashDeal && (
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse shrink-0">
                        FLASH
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-yellow-500 shrink-0" />
                      <span className="text-sm font-medium">{deal.business.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 min-w-0">
                      <MapPin size={14} className="shrink-0" />
                      <span className="text-xs truncate">{deal.business.address.split(',')[0]}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal Info */}
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-4xl font-bold text-orange-600 mb-1">
                      {deal.discount}% OFF
                    </div>
                    <h4 className="font-semibold text-gray-900">{deal.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{deal.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                  <Clock size={14} />
                  <span>Ends in {getTimeRemaining(deal.expiresAt)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl"
                >
                  Claim Deal
                </motion.button>
                <button
                  type="button"
                  onClick={() => navigate('/', { state: { navigateToBusinessId: deal.business.id } })}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                >
                  Navigate
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
