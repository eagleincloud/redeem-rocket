import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Heart, Gavel, ClipboardList, ShoppingBag, Bell, CreditCard, Settings, LogOut, ChevronRight, Camera, Phone, Mail, Save } from 'lucide-react';
import { useNavigate }  from 'react-router-dom';
import { LOCATION_PIN_ICONS, DEFAULT_LOCATION_PIN_ICON } from '../constants';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

type UserState = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  memberSince: string;
  role?: string;
  locationPinIcon?: string;
};

function loadUserFromStorage(): UserState {
  try {
    const s = localStorage.getItem('user');
    const p = s ? JSON.parse(s) : {};
    return {
      id: p.id,
      name: p.name ?? 'Demo User',
      email: p.email ?? 'demo@example.com',
      phone: p.phone ?? '',
      avatar: p.avatar ?? '👤',
      memberSince: p.memberSince ?? 'January 2025',
      role: p.role,
      locationPinIcon: p.locationPinIcon ?? DEFAULT_LOCATION_PIN_ICON,
    };
  } catch {
    return {
      name: 'Demo User',
      email: 'demo@example.com',
      avatar: '👤',
      memberSince: 'January 2025',
      locationPinIcon: DEFAULT_LOCATION_PIN_ICON,
    };
  }
}

function saveUserToStorage(user: UserState) {
  try {
    const existing = localStorage.getItem('user');
    const merged = existing ? { ...JSON.parse(existing), ...user } : user;
    localStorage.setItem('user', JSON.stringify(merged));
  } catch {
    // ignore
  }
}

export function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<UserState>(loadUserFromStorage);

  const saveUser = (updates: Partial<UserState>) => {
    const next = { ...user, ...updates };
    setUser(next);
    saveUserToStorage(next);
    if ('locationPinIcon' in updates) {
      window.dispatchEvent(new CustomEvent('locationPinIconChanged'));
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      saveUser({ avatar: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    {
      icon: Heart,
      label: 'Saved Businesses',
      count: 12,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      icon: ShoppingBag,
      label: 'Saved Offers',
      count: 8,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Gavel,
      label: 'My Auctions',
      count: 3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: ClipboardList,
      label: 'My Requirements',
      count: 2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: ShoppingBag,
      label: 'Order History',
      count: 15,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const settingsItems = [
    { icon: Bell, label: 'Notifications', color: 'text-yellow-600', bgColor: 'bg-yellow-100', action: null as null | (() => void) },
    { icon: CreditCard, label: 'Payment Methods', color: 'text-indigo-600', bgColor: 'bg-indigo-100', action: null as null | (() => void) },
    { icon: Settings, label: 'Settings', color: 'text-gray-600', bgColor: 'bg-gray-100', action: null as null | (() => void) },
    {
      icon: '🧭' as unknown as typeof Settings,
      label: 'Replay Feature Tour',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      action: () => {
        localStorage.removeItem('geo:feature_guide_done');
        window.dispatchEvent(new CustomEvent('geo:replay_feature_guide'));
        navigate('/');
      },
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-indigo-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 pb-12">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>

        {/* Profile Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 border border-white/30"
        >
          <div className="flex items-center gap-4 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              aria-label="Upload profile photo"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl overflow-hidden border-2 border-white/50 hover:border-white focus:outline-none focus:ring-2 focus:ring-white/80"
              title="Upload profile photo"
            >
              {user.avatar.startsWith('data:') || user.avatar.startsWith('http') ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{user.avatar}</span>
              )}
              <span className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-full flex items-end justify-center pb-1">
                <Camera size={20} className="text-white mb-1" />
              </span>
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-indigo-100">{user.email}</p>
              <p className="text-xs text-indigo-200 mt-1">Member since {user.memberSince}</p>
              <p className="text-xs text-indigo-200/80 mt-1">Tap photo to upload</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">1250</div>
              <div className="text-xs text-indigo-200">Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">12</div>
              <div className="text-xs text-indigo-200">Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">15</div>
              <div className="text-xs text-indigo-200">Orders</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notification Contacts */}
      <div className="px-6 -mt-6 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-md"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
            <Bell size={15} className="text-indigo-500" />
            Notification Contacts
          </h3>
          <p className="text-xs text-gray-400 mb-3">Get payment & order updates via Email, SMS, and WhatsApp</p>
          <div className="space-y-2">
            {/* Email (read-only, from account) */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Mail size={14} className="text-indigo-400 shrink-0" />
              <span className="text-xs text-gray-500 w-16 shrink-0">Email</span>
              <span className="text-xs text-gray-700 font-medium flex-1 truncate">{user.email}</span>
              <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Active</span>
            </div>
            {/* Phone number input */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1">
                <Phone size={14} className="text-green-500 shrink-0" />
                <span className="text-xs text-gray-500 w-16 shrink-0">Phone</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={user.phone ?? ''}
                  onChange={e => setUser(u => ({ ...u, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  className="text-xs text-gray-700 font-medium flex-1 bg-transparent outline-none placeholder-gray-300"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  const phone = user.phone?.replace(/\D/g, '') ?? '';
                  if (phone.length !== 10) { toast.error('Enter a valid 10-digit number'); return; }
                  saveUser({ phone });
                  // Save to user_profiles in Supabase
                  if (supabase && user.id) {
                    await supabase.from('user_profiles').upsert({
                      user_id: user.id,
                      phone,
                      email: user.email,
                      updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' });
                  }
                  toast.success('📱 Phone saved — notifications enabled!');
                }}
                className="bg-indigo-500 text-white rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Save size={12} />
                Save
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            📱 SMS &amp; WhatsApp · 📧 Email · All channels active when saved
          </p>
        </motion.div>
      </div>

      {/* Location pin icon */}
      <div className="px-6 -mt-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-md"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Location pin icon</h3>
          <p className="text-xs text-gray-500 mb-3">Choose an icon for your position on the map</p>
          <div className="grid grid-cols-8 gap-2">
            {LOCATION_PIN_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => saveUser({ locationPinIcon: icon })}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                  user.locationPinIcon === icon
                    ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={`Use ${icon} on map`}
              >
                {icon}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Menu Items */}
      <div className="px-6 -mt-6">
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center`}>
                  <item.icon size={24} className={item.color} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">{item.label}</div>
                  {item.count && (
                    <div className="text-sm text-gray-500">{item.count} items</div>
                  )}
                </div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Settings Section */}
      <div className="px-6 mt-8">
        <h2 className="text-lg font-bold mb-4">Settings</h2>
        <div className="space-y-3">
          {settingsItems.map((item, index) => (
            <motion.button
              key={item.label}
              onClick={() => item.action?.()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (menuItems.length + index) * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center`}>
                  {typeof item.icon === 'string'
                    ? <span style={{ fontSize: 22 }}>{item.icon}</span>
                    : <item.icon size={24} className={item.color} />
                  }
                </div>
                <div className="font-semibold">{item.label}</div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Subscription Section */}
      <div className="px-6 mt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-2xl p-6 text-white"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold mb-1">Go Premium!</h3>
              <p className="text-sm text-white/90">
                Unlock exclusive deals and early access to auctions
              </p>
            </div>
            <span className="text-3xl">👑</span>
          </div>
          <ul className="space-y-2 mb-4 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-white">✓</span> Exclusive premium deals
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">✓</span> Early auction access
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">✓</span> 2x reward points
            </li>
          </ul>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold shadow-lg w-full"
          >
            Upgrade Now - $9.99/mo
          </motion.button>
        </motion.div>
      </div>

      {/* Logout Button */}
      <div className="px-6 mt-8 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full bg-red-50 border-2 border-red-200 text-red-600 rounded-2xl p-4 font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Logout
        </motion.button>
      </div>
    </div>
  );
}
