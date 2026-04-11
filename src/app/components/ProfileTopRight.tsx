import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, Settings } from 'lucide-react';

export function ProfileTopRight() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    setOpen(false);
    navigate('/login');
  };

  const handleProfileManager = () => {
    setOpen(false);
    navigate('/profile');
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-white/90 backdrop-blur-md p-2.5 shadow-lg hover:bg-white transition-colors border border-gray-200/80"
        aria-label="Profile menu"
      >
        <User size={22} className="text-gray-700" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden="true"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-48 py-1 rounded-xl bg-white shadow-xl border border-gray-200 z-50"
            >
              <button
                type="button"
                onClick={handleProfileManager}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <Settings size={18} className="text-gray-500 shrink-0" />
                <span className="font-medium text-sm">Profile Manager</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} className="shrink-0" />
                <span className="font-medium text-sm">Sign out</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
