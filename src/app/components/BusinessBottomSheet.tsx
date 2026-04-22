import { useNavigate }  from 'react-router-dom';
import { motion } from 'motion/react';
import { Business } from '../types';
import { Navigation, Heart, Star, Clock, MapPin, X, Flame, ShoppingCart, ExternalLink } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface BusinessBottomSheetProps {
  business: Business;
  onClose: () => void;
  onStartNavigation: (business: Business) => void;
  onOpenBusiness: (businessId: string) => void;
}

export function BusinessBottomSheet({ business, onClose, onStartNavigation, onOpenBusiness }: BusinessBottomSheetProps) {
  const navigate = useNavigate();
  const { addOffer } = useCart();

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  };

  const handleBuyNow = (offerId: string) => {
    onClose();
    navigate(`/business/${business.id}`);
  };

  const handleAddToCart = (offer: Business['offers'][0]) => {
    addOffer(offer, business.name);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-30 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{business.logo}</span>
                <div>
                  <h2 className="text-2xl font-bold">{business.name}</h2>
                  <p className="text-gray-600 text-sm">{business.category}</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{business.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <MapPin size={16} />
              <span className="text-sm">{business.address}</span>
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            {business.isPremium && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Premium</span>
            )}
            {business.hasAuction && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Active Auction</span>
            )}
          </div>

          {/* Offers with Buy now / Add to cart */}
          {business.offers.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Flame className="text-orange-500" size={20} />
                Today's Offers
              </h3>
              {business.offers.map((offer) => (
                <motion.div
                  key={offer.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-2xl font-bold text-orange-600">{offer.discount}% OFF</span>
                        {offer.isFlashDeal && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded animate-pulse">FLASH</span>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900">{offer.title}</h4>
                      <p className="text-sm text-gray-600">{offer.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-orange-600 text-sm font-medium mb-3">
                    <Clock size={14} />
                    <span>Ends in {getTimeRemaining(offer.expiresAt)}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleBuyNow(offer.id)}
                      className="flex-1 min-w-[100px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold shadow hover:shadow-md transition-shadow flex items-center justify-center gap-1.5"
                    >
                      Buy now
                    </button>
                    <button
                      onClick={() => handleAddToCart(offer)}
                      className="flex-1 min-w-[100px] py-2.5 px-3 rounded-xl bg-white border-2 border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart size={16} />
                      Add to cart
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Action row: Navigate (in-app, closes sheet) + Open business page */}
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => {
                onStartNavigation(business);
                onClose();
              }}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
            >
              <Navigation size={20} />
              Navigate
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-pink-100 text-pink-600 rounded-2xl hover:bg-pink-200 transition-colors"
            >
              <Heart size={20} />
            </motion.button>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenBusiness(business.id);
            }}
            className="w-full py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink size={18} />
            Open business page
          </button>
        </div>
      </motion.div>
    </>
  );
}
