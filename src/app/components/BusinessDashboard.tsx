import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store, Users, IndianRupee, Plus,
  BarChart3, MessageSquare, Package, X, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import type { Offer } from '../types';

interface ManagedOffer extends Omit<Offer, 'expiresAt'> {
  expiresAt: Date;
  claimed: number;
}

const initialOffers: ManagedOffer[] = [
  { id: 'mo1', businessId: 'b1', title: '20% OFF on all drinks', description: 'Valid for dine-in only', discount: 20, price: 299, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), category: 'Food & Beverage', claimed: 45, status: 'approved' },
  { id: 'mo2', businessId: 'b1', title: 'Buy 1 Get 1 Free', description: 'On selected items', discount: 50, price: 1999, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), category: 'Fashion', claimed: 32, status: 'pending_approval' },
  { id: 'mo3', businessId: 'b1', title: 'Free delivery', description: 'On orders over ₹800', discount: 15, price: 0, expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), category: 'Food & Beverage', claimed: 28, status: 'rejected', rejection_reason: 'Incomplete description — please add minimum order value.' },
];

export function BusinessDashboard() {
  const [stats] = useState({
    totalRevenue: 124500,
    totalCustomers: 234,
    pendingRequirements: 8,
  });
  const [offers, setOffers] = useState<ManagedOffer[]>(initialOffers);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  // Create Offer form state
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerDiscount, setOfferDiscount] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  // Create Product form state
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productMrp, setProductMrp] = useState('');
  const [productSp, setProductSp] = useState('');
  const [productCategory, setProductCategory] = useState('General');

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim() || !offerDiscount) return;
    const newOffer: ManagedOffer = {
      id: `mo-${Date.now()}`,
      businessId: 'b1',
      title: offerTitle,
      description: offerDesc,
      discount: Number(offerDiscount),
      price: Number(offerPrice) || 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      category: 'General',
      claimed: 0,
      status: 'pending_approval',
    };
    setOffers((prev) => [newOffer, ...prev]);
    setOfferTitle(''); setOfferDesc(''); setOfferDiscount(''); setOfferPrice('');
    setShowCreateOffer(false);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const mrp = Number(productMrp);
    const sp = Number(productSp);
    if (!productName.trim() || !mrp || !sp || sp >= mrp) return;
    setProductName(''); setProductDesc(''); setProductMrp(''); setProductSp(''); setProductCategory('General');
    setShowCreateProduct(false);
    alert(`Product "${productName}" created (MRP ₹${mrp}, SP ₹${sp}). Platform margin: ₹${mrp - sp}. In production this saves to database.`);
  };

  const offerStatusConfig = {
    approved: { label: 'Live', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    pending_approval: { label: 'Awaiting Approval', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-blue-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
        <div className="flex items-center gap-3">
          <Store size={32} />
          <div>
            <h1 className="text-3xl font-bold">Business Dashboard</h1>
            <p className="text-blue-100 text-sm">Manage your business</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <IndianRupee className="text-green-600" size={24} />
              </div>
              <div>
                <div className="text-sm text-gray-600">Revenue</div>
                <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">+12% this month</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <div className="text-sm text-gray-600">Customers</div>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              </div>
            </div>
            <div className="text-xs text-blue-600 font-medium">+8 new today</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Package className="text-orange-600" size={24} />
              </div>
              <div>
                <div className="text-sm text-gray-600">Live Offers</div>
                <div className="text-2xl font-bold">{offers.filter((o) => o.status === 'approved').length}</div>
              </div>
            </div>
            <div className="text-xs text-yellow-600 font-medium">
              {offers.filter((o) => o.status === 'pending_approval').length} pending approval
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-purple-600" size={24} />
              </div>
              <div>
                <div className="text-sm text-gray-600">Requests</div>
                <div className="text-2xl font-bold">{stats.pendingRequirements}</div>
              </div>
            </div>
            <div className="text-xs text-purple-600 font-medium">Respond quickly</div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 pb-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreateOffer(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-5 shadow-lg flex flex-col items-center gap-2">
            <Plus size={32} />
            <span className="font-semibold">Create Offer</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreateProduct(true)} className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl p-5 shadow-lg flex flex-col items-center gap-2">
            <Package size={32} />
            <span className="font-semibold">Add Product</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl p-5 shadow-lg flex flex-col items-center gap-2">
            <Package size={32} />
            <span className="font-semibold">Start Auction</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl p-5 shadow-lg flex flex-col items-center gap-2">
            <BarChart3 size={32} />
            <span className="font-semibold">Analytics</span>
          </motion.button>
        </div>
      </div>

      {/* Offers with approval statuses */}
      <div className="px-6 pb-6">
        <h2 className="text-xl font-bold mb-4">My Offers</h2>
        <div className="space-y-3">
          {offers.map((offer, index) => {
            const statusCfg = offerStatusConfig[offer.status ?? 'pending_approval'];
            const StatusIcon = statusCfg.icon;
            return (
              <motion.div key={offer.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-2xl p-4 shadow-md">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{offer.title}</h3>
                    <p className="text-sm text-gray-600">{offer.claimed} customers claimed</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-2xl font-bold text-orange-600">{offer.discount}%</div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
                      <StatusIcon size={12} />
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
                {offer.status === 'rejected' && offer.rejection_reason && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-2 mb-2 flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{offer.rejection_reason}</p>
                  </div>
                )}
                {offer.status === 'pending_approval' && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-2 mb-2">
                    <p className="text-xs text-yellow-700">⏳ Waiting for admin approval before showing to customers.</p>
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200">Edit</button>
                  <button onClick={() => setOffers((prev) => prev.filter((o) => o.id !== offer.id))} className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200">Remove</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Customer Requirements */}
      <div className="px-6 pb-6">
        <h2 className="text-xl font-bold mb-4">Customer Requirements</h2>
        <div className="space-y-3">
          {[
            { title: 'Need AC Repair Today', budget: 1500, urgency: 'high' },
            { title: 'Catering for 30 people', budget: 15000, urgency: 'medium' },
            { title: 'Interior painting', budget: 8000, urgency: 'low' },
          ].map((req, index) => (
            <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-2xl p-4 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{req.title}</h3>
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${req.urgency === 'high' ? 'bg-red-100 text-red-700' : req.urgency === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {req.urgency.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Budget</div>
                  <div className="text-xl font-bold text-green-600">₹{req.budget.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium">Send Quote</motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Offer Modal */}
      <AnimatePresence>
        {showCreateOffer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateOffer(false)} className="fixed inset-0 bg-black/50 z-40" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create Offer</h2>
                <button onClick={() => setShowCreateOffer(false)} className="p-2"><X size={20} /></button>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  Offers require admin approval before customers can see them.
                </p>
              </div>
              <form onSubmit={handleCreateOffer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Offer Title *</label>
                  <input value={offerTitle} onChange={(e) => setOfferTitle(e.target.value)} type="text" placeholder="e.g., 20% OFF on all drinks" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={offerDesc} onChange={(e) => setOfferDesc(e.target.value)} rows={2} placeholder="Terms and conditions..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount % *</label>
                    <input value={offerDiscount} onChange={(e) => setOfferDiscount(e.target.value)} type="number" min="1" max="90" placeholder="20" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (₹)</label>
                    <input value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} type="number" min="0" placeholder="299" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateOffer(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md">Submit for Approval</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Product Modal */}
      <AnimatePresence>
        {showCreateProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateProduct(false)} className="fixed inset-0 bg-black/50 z-40" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Add Product</h2>
                <button onClick={() => setShowCreateProduct(false)} className="p-2"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Name *</label>
                  <input value={productName} onChange={(e) => setProductName(e.target.value)} type="text" placeholder="e.g., Latte" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} rows={2} placeholder="Product details..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500">
                    {['Food', 'Drinks', 'Services', 'Electronics', 'Clothing', 'Health & Beauty', 'General'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">MRP (₹) *</label>
                    <input value={productMrp} onChange={(e) => setProductMrp(e.target.value)} type="number" min="1" placeholder="500" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Selling Price (₹) *</label>
                    <input value={productSp} onChange={(e) => setProductSp(e.target.value)} type="number" min="1" placeholder="400" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500" required />
                  </div>
                </div>
                {productMrp && productSp && Number(productSp) < Number(productMrp) && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="text-sm text-green-800 font-medium">Margin preview</div>
                    <div className="text-xs text-green-700 mt-1">
                      Platform margin: ₹{Number(productMrp) - Number(productSp)} · Cashback range: ₹1–₹{Math.floor((Number(productMrp) - Number(productSp)) / 2)}
                    </div>
                    <div className="text-xs text-green-600 mt-0.5">Platform keeps ≥50% of margin</div>
                  </div>
                )}
                {productMrp && productSp && Number(productSp) >= Number(productMrp) && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-sm text-red-700">Selling price must be less than MRP</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateProduct(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold">Cancel</button>
                  <button type="submit" disabled={!productMrp || !productSp || Number(productSp) >= Number(productMrp)} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold shadow-md disabled:opacity-50">Add Product</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
