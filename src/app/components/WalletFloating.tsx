import { useNavigate }  from 'react-router-dom';
import { motion } from 'motion/react';
import { Wallet } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export function WalletFloating() {
  const navigate = useNavigate();
  const { balance } = useWallet();

  return (
    <motion.button
      type="button"
      onClick={() => navigate('/wallet')}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="fixed top-24 right-4 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-lg hover:shadow-xl hover:bg-white transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
        <Wallet size={20} />
      </div>
      <div className="text-left">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Wallet</div>
        <div className="text-lg font-bold text-gray-900">
          ${Math.max(0, balance).toFixed(2)}
        </div>
      </div>
    </motion.button>
  );
}
