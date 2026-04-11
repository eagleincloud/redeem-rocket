import { motion, AnimatePresence } from 'motion/react';
import { Bell } from 'lucide-react';
import { useState } from 'react';

export function NotificationBadge() {
  const [notifications] = useState([
    {
      id: '1',
      title: 'Flash Deal Alert! 🔥',
      message: 'Urban Coffee House: 20% OFF expires in 2h',
      time: '5m ago',
      type: 'deal',
      unread: true,
    },
    {
      id: '2',
      title: 'Auction Ending Soon',
      message: 'Designer Handbag Collection ends in 30 minutes',
      time: '15m ago',
      type: 'auction',
      unread: true,
    },
    {
      id: '3',
      title: 'New Response to Your Requirement',
      message: 'Cool Air Solutions quoted $120 for AC repair',
      time: '1h ago',
      type: 'requirement',
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      className="fixed top-4 right-4 z-40"
    >
      <button className="relative bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all">
        <Bell size={24} className="text-gray-700" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
          >
            {unreadCount}
          </motion.div>
        )}
      </button>
    </motion.div>
  );
}
