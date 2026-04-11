import { motion } from 'motion/react';
import { TrendingUp, Star, MapPin } from 'lucide-react';
import { useSearchCategory } from '../context/SearchCategoryContext';

const categoryCards = [
  { name: 'Food & Beverage', icon: '🍔', color: 'bg-orange-100 text-orange-600' },
  { name: 'Fashion', icon: '👗', color: 'bg-pink-100 text-pink-600' },
  { name: 'Electronics', icon: '📱', color: 'bg-blue-100 text-blue-600' },
  { name: 'Health & Beauty', icon: '💆', color: 'bg-purple-100 text-purple-600' },
  { name: 'Health & Fitness', icon: '💪', color: 'bg-green-100 text-green-600' },
  { name: 'Home Services', icon: '🏠', color: 'bg-yellow-100 text-yellow-600' },
];

export function ExplorePage() {
  const { locationBusinesses, setCategory } = useSearchCategory();
  const filteredBusinesses = locationBusinesses;

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-blue-50 to-white pb-24">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Explore</h1>
      </div>

      {/* Category cards (browse) */}
      <div className="px-6 pb-4">
        <h2 className="text-xl font-bold mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 gap-3">
          {categoryCards.map((cat, index) => (
            <motion.button
              key={cat.name}
              type="button"
              onClick={() => setCategory(cat.name)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${cat.color} p-6 rounded-2xl font-semibold text-left shadow-sm hover:shadow-md transition-all`}
            >
              <div className="text-4xl mb-2">{cat.icon}</div>
              <div className="text-sm font-medium">{cat.name}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Trending Businesses */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-orange-500" size={24} />
          <h2 className="text-xl font-bold">Trending Now</h2>
        </div>
        <div className="space-y-4">
          {filteredBusinesses.slice(0, 5).map((business, index) => (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{business.logo}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{business.name}</h3>
                  <p className="text-gray-600 text-sm">{business.category}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{business.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin size={14} />
                      <span className="text-xs">{business.address.split(',')[0]}</span>
                    </div>
                  </div>
                </div>
                {business.offers.length > 0 && (
                  <div className="bg-orange-500 text-white px-3 py-2 rounded-xl text-sm font-bold">
                    {business.offers[0].discount}% OFF
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured Merchants */}
      <div className="px-6 pb-6">
        <h2 className="text-xl font-bold mb-4">Featured Merchants</h2>
        <div className="grid grid-cols-2 gap-4">
          {filteredBusinesses.filter(b => b.isPremium).map((business, index) => (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 shadow-md"
            >
              <div className="text-4xl mb-2">{business.logo}</div>
              <h3 className="font-semibold">{business.name}</h3>
              <p className="text-xs text-gray-600 mt-1">{business.category}</p>
              <div className="flex items-center gap-1 mt-2">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-medium">{business.rating}</span>
              </div>
              <span className="inline-block mt-2 px-2 py-0.5 bg-purple-500 text-white text-xs font-semibold rounded-full">
                Premium
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
