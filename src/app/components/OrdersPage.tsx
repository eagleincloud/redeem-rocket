import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { Receipt, ArrowLeft, CheckCircle, Clock, Gift, IndianRupee } from 'lucide-react';
import { motion } from 'motion/react';
import { useOrders } from '../context/OrdersContext';
import { useWallet } from '../context/WalletContext';

export function OrdersPage() {
  const navigate = useNavigate();
  const { orders, setOrderRedeemed } = useOrders();
  const { addTransaction } = useWallet();

  const handleMarkRedeemed = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.redeemed) return;

    // Use pre-computed cashback from checkout, or fallback to 0
    const cashbackAmount = order.cashbackAmount ?? 0;
    if (cashbackAmount > 0) {
      addTransaction({
        type: 'cashback',
        amount: cashbackAmount,
        description: `Cashback from ${order.businessName}`,
      });
    }
    setOrderRedeemed(orderId, true);
  };

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Recent Orders</h1>
      </div>
      <div className="p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Receipt size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders yet.</p>
            <p className="text-gray-400 text-sm mt-1">Shop at a business to see your orders here.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-3 rounded-xl bg-black text-white font-medium"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Receipt size={20} className="text-gray-500 shrink-0" />
                    <span className="font-semibold text-gray-900 truncate">{order.businessName}</span>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.redeemed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {order.redeemed ? (
                      <>
                        <CheckCircle size={14} />
                        Redeemed
                      </>
                    ) : (
                      <>
                        <Clock size={14} />
                        Pending
                      </>
                    )}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-3">
                  {format(new Date(order.createdAt), 'dd MMM yyyy, h:mm a')}
                </p>

                <div className="bg-gray-100 rounded-xl p-4 text-center mb-3">
                  <p className="text-xs text-gray-600 mb-1">Verification code — show at merchant</p>
                  <p className="text-2xl font-mono font-bold tracking-widest text-gray-900">
                    {order.verificationCode}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <IndianRupee size={14} />
                    {order.total.toFixed(0)} · {order.items.length} item(s)
                  </span>
                  {(order.cashbackAmount ?? 0) > 0 && (
                    <span className={`flex items-center gap-1 font-medium ${order.redeemed ? 'text-green-600' : 'text-gray-400'}`}>
                      <Gift size={14} />
                      {order.redeemed ? `₹${order.cashbackAmount} credited` : `₹${order.cashbackAmount} pending`}
                    </span>
                  )}
                </div>
              </div>

              {!order.redeemed && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleMarkRedeemed(order.id)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Mark as Redeemed & Claim Cashback
                    {(order.cashbackAmount ?? 0) > 0 && (
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">₹{order.cashbackAmount}</span>
                    )}
                  </button>
                </div>
              )}

              {order.redeemed && (order.cashbackAmount ?? 0) > 0 && (
                <div className="border-t border-gray-100 bg-green-50 px-4 py-3">
                  <div className="flex items-center justify-center gap-2 text-green-700 text-sm font-medium">
                    <Gift size={16} />
                    ₹{order.cashbackAmount} cashback added to your wallet
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
