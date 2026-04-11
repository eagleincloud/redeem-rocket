import { motion } from 'motion/react';
import { Wallet, TrendingUp, TrendingDown, IndianRupee, CreditCard, QrCode, AlertTriangle, ShoppingBag, Info } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { format, differenceInDays } from 'date-fns';

export function WalletPage() {
  const { transactions, balance, getExpiringTransactions } = useWallet();

  const expiringIn30 = getExpiringTransactions(30);
  const expiringIn15 = getExpiringTransactions(15);

  const totalCashbackEarned = transactions
    .filter((t) => t.amount > 0 && t.type === 'cashback')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-yellow-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <Wallet size={32} />
          <h1 className="text-3xl font-bold">My Wallet</h1>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 border border-white/30"
        >
          <div className="text-sm text-yellow-100 mb-1">Cashback Balance</div>
          <div className="text-5xl font-bold mb-2 flex items-center gap-1">
            <span className="text-3xl">₹</span>{Math.max(0, balance).toFixed(0)}
          </div>
          <div className="text-xs text-yellow-100 flex items-center gap-1.5 mt-1">
            <Info size={12} />
            Use at checkout · Cannot be withdrawn · Expires in 1 year
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white/10 rounded-2xl p-3">
              <div className="text-xs text-yellow-100 mb-1">Total Earned</div>
              <div className="text-xl font-bold flex items-center gap-1">
                <IndianRupee size={16} />{totalCashbackEarned.toFixed(0)}
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <div className="text-xs text-yellow-100 mb-1">Total Used</div>
              <div className="text-xl font-bold flex items-center gap-1">
                <IndianRupee size={16} />{totalSpent.toFixed(0)}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* How to Use Banner */}
      <div className="mx-6 mt-6 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl p-4 flex items-center gap-4">
        <ShoppingBag size={32} className="shrink-0" />
        <div>
          <div className="font-bold text-base">Shop → Earn Cashback → Shop Again</div>
          <div className="text-green-100 text-sm mt-0.5">Every purchase earns you cashback. Apply it on your next order!</div>
        </div>
      </div>

      {/* Expiring Soon Warnings */}
      {expiringIn30.length > 0 && (
        <div className="px-6 mt-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-orange-700">
            <AlertTriangle size={20} className="text-orange-500" />
            Expiring Soon
          </h2>
          <div className="space-y-2">
            {expiringIn30.map((tx) => {
              const daysLeft = differenceInDays(new Date(tx.expiry_date!), new Date());
              const isUrgent = expiringIn15.some((t) => t.id === tx.id);
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-2xl p-4 border-2 flex items-center justify-between ${
                    isUrgent
                      ? 'bg-red-50 border-red-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div>
                    <div className={`text-sm font-semibold ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}>
                      {isUrgent ? '⚠️ Urgent:' : '🕐'} ₹{tx.amount} cashback
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{tx.description}</div>
                    <div className={`text-xs font-medium mt-1 ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
                      Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''} · {format(new Date(tx.expiry_date!), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
                    ₹{tx.amount}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-6">
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-md hover:shadow-lg"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <QrCode size={20} className="text-purple-600" />
            </div>
            <span className="text-xs font-medium">Scan & Pay</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-md hover:shadow-lg"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <CreditCard size={20} className="text-orange-600" />
            </div>
            <span className="text-xs font-medium">Linked Cards</span>
          </motion.button>
        </div>
      </div>

      {/* Statistics */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-bold mb-4">Summary</h2>
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-green-50 rounded-2xl p-4 border-2 border-green-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-600" size={20} />
              <span className="text-sm font-medium text-green-700">Cashback Earned</span>
            </div>
            <div className="text-2xl font-bold text-green-900">₹{totalCashbackEarned.toFixed(0)}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 rounded-2xl p-4 border-2 border-red-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="text-red-600" size={20} />
              <span className="text-sm font-medium text-red-700">Cashback Used</span>
            </div>
            <div className="text-2xl font-bold text-red-900">₹{totalSpent.toFixed(0)}</div>
          </motion.div>
        </div>
      </div>

      {/* Transactions */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-bold mb-4">Transaction History</h2>
        <div className="space-y-3">
          {transactions.map((transaction, index) => {
            const isExpiredTx = transaction.expiry_date && new Date(transaction.expiry_date).getTime() < Date.now();
            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className={`bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all ${isExpiredTx ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.type === 'cashback' ? 'bg-green-100' :
                        transaction.type === 'payment' ? 'bg-red-100' :
                        'bg-blue-100'
                      }`}
                    >
                      {transaction.type === 'cashback' && <TrendingUp size={20} className="text-green-600" />}
                      {transaction.type === 'payment' && <CreditCard size={20} className="text-red-600" />}
                      {transaction.type === 'refund' && <IndianRupee size={20} className="text-blue-600" />}
                    </div>
                    <div>
                      <div className="font-semibold capitalize flex items-center gap-2">
                        {transaction.type === 'cashback' ? 'Cashback' : transaction.type === 'payment' ? 'Used' : 'Refund'}
                        {isExpiredTx && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Expired</span>}
                      </div>
                      <div className="text-sm text-gray-600">{transaction.description}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(transaction.createdAt), 'dd MMM yyyy, h:mm a')}
                      </div>
                      {transaction.expiry_date && transaction.amount > 0 && !isExpiredTx && (
                        <div className="text-xs text-orange-500 mt-0.5">
                          Expires {format(new Date(transaction.expiry_date), 'dd MMM yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(0)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Referral Section */}
      <div className="mx-6 mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-2">Refer & Earn</h3>
        <p className="text-blue-100 text-sm mb-4">
          Invite friends and earn ₹200 cashback for each successful referral!
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow-lg"
        >
          Invite Friends
        </motion.button>
      </div>
    </div>
  );
}
