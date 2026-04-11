import { motion } from 'motion/react';
import { Info, X } from 'lucide-react';
import { useState } from 'react';

export function SetupInfo() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%]"
    >
      <div className="bg-blue-500 text-white rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <Info size={24} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold mb-1">Setup Required</h3>
            <p className="text-sm text-blue-100">
              Replace the Google Maps API key in <code className="bg-blue-600 px-1 rounded">constants</code> with your own key (used for search/geocoding in the header).
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-1 hover:bg-blue-600 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
