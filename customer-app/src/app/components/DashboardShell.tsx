import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Button } from './ui/button';
import { getAppData } from '../utils/appState';
import { categoryData, getPresetById } from '../utils/categoryStyles';
import { getSession, logout } from '../utils/auth';
import FeatureRequestDialog from './FeatureRequestDialog';
import {
  LayoutDashboard, Users, Megaphone, Zap, Settings, Rocket,
  ChevronLeft, ChevronRight, Bell, Search, Menu, X,
  Star, LogOut, User, ChevronDown,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'CRM & Leads', path: '/dashboard/leads', icon: Users, exact: false },
  { label: 'Marketing', path: '/dashboard/marketing', icon: Megaphone, exact: false },
  { label: 'Automation', path: '/dashboard/automation', icon: Zap, exact: false },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings, exact: false },
];

export default function DashboardShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [preset, setPreset] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = getAppData();
    setAppData(data);
    if (data.category && data.stylePresetId) {
      setPreset(getPresetById(data.category, data.stylePresetId));
    }
    setSession(getSession());
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const catInfo = appData?.category
    ? (categoryData[appData.category] ?? categoryData['Other'])
    : categoryData['Other'];
  const primaryColor = preset?.primary ?? '#3B82F6';
  const accentColor = preset?.accent ?? '#8B5CF6';
  const businessName = appData?.appName || appData?.businessName || 'My Business';
  const userName = session?.name ?? '';
  const userEmail = session?.email ?? '';

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const activeLabel = navItems.find(i => isActive(i))?.label ?? 'Dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`flex flex-col h-full bg-white ${isMobile ? '' : 'border-r border-gray-100'}`}>
      {/* Logo / Business Name */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b border-gray-100"
        style={{ minHeight: 64 }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
        >
          <span style={{ fontSize: '1rem' }}>{catInfo.emoji}</span>
        </div>
        {(!collapsed || isMobile) && (
          <div className="flex-1 min-w-0">
            <div
              className="text-gray-900 truncate"
              style={{ fontWeight: 700, fontSize: '0.9rem' }}
            >
              {businessName}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-gray-400">{appData?.category || 'Business'} • Live</span>
            </div>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                active ? 'shadow-sm' : 'hover:bg-gray-50'
              }`}
              style={
                active
                  ? { background: `linear-gradient(135deg, ${primaryColor}18, ${accentColor}18)`, color: primaryColor }
                  : { color: '#6B7280' }
              }
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                style={
                  active
                    ? { background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }
                    : { backgroundColor: 'transparent' }
                }
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: active ? '#FFFFFF' : '#9CA3AF' }}
                />
              </div>
              {(!collapsed || isMobile) && (
                <span
                  className="text-sm"
                  style={{ fontWeight: active ? 600 : 400, color: active ? primaryColor : '#374151' }}
                >
                  {item.label}
                </span>
              )}
              {(!collapsed || isMobile) && active && (
                <div
                  className="ml-auto w-1.5 h-5 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-3 border-t border-gray-100 space-y-1">
        {(!collapsed || isMobile) && (
          <div
            className="mx-1 mb-2 p-3 rounded-xl"
            style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)` }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Star className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span className="text-xs" style={{ fontWeight: 700, color: primaryColor }}>
                Need a feature?
              </span>
            </div>
            <FeatureRequestDialog
              trigger={
                <button
                  className="text-xs text-white w-full py-1.5 rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, fontWeight: 600 }}
                >
                  Request Custom Feature
                </button>
              }
            />
          </div>
        )}

        {/* User info + logout row */}
        {(!collapsed || isMobile) ? (
          <div className="mx-1 flex items-center gap-2 p-2.5 rounded-xl bg-gray-50">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 text-xs"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, fontWeight: 700 }}
            >
              {userName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-800 text-xs truncate" style={{ fontWeight: 600 }}>{userName || 'User'}</div>
              <div className="text-gray-400 text-xs truncate">{userEmail}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div
        className="hidden lg:flex flex-col flex-shrink-0 transition-all duration-300"
        style={{ width: collapsed ? 64 : 240 }}
      >
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full shadow-2xl z-50">
            <Sidebar isMobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h1 className="text-gray-900" style={{ fontWeight: 600, fontSize: '1.05rem' }}>
              {activeLabel}
            </h1>
            <p className="text-xs text-gray-400 hidden sm:block">
              {appData?.category || 'Business'} Dashboard
            </p>
          </div>

          {/* Top-right actions */}
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl text-gray-500 text-sm hover:bg-gray-200 transition-all">
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <span className="text-xs text-gray-400 ml-1">⌘K</span>
            </button>
            <Button variant="ghost" size="icon" className="relative w-9 h-9">
              <Bell className="w-4 h-4" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </Button>

            {/* User avatar + dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-1.5 rounded-xl px-1.5 py-1 hover:bg-gray-100 transition-all"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, fontSize: '0.8rem', fontWeight: 700 }}
                >
                  {userName[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-xl border border-gray-100 bg-white z-50 overflow-hidden"
                  style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
                >
                  {/* User info header */}
                  <div
                    className="px-4 py-3 border-b border-gray-50"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)` }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-2"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, fontWeight: 700, fontSize: '1rem' }}
                    >
                      {userName[0]?.toUpperCase() || 'U'}
                    </div>
                    <p className="text-gray-900 text-sm truncate" style={{ fontWeight: 700 }}>{userName || 'User'}</p>
                    <p className="text-gray-500 text-xs truncate">{userEmail}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <button
                      onClick={() => { navigate('/dashboard/settings'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span style={{ fontWeight: 500 }}>Account Settings</span>
                    </button>
                    <button
                      onClick={() => { navigate('/customize'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <Rocket className="w-4 h-4 text-gray-400" />
                      <span style={{ fontWeight: 500 }}>Redesign App</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-100 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span style={{ fontWeight: 600 }}>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Section Pill (mobile) */}
        <div className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item);
            if (!active) return null;
            return (
              <div key={item.path} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                <span className="text-sm" style={{ color: primaryColor, fontWeight: 600 }}>{item.label}</span>
              </div>
            );
          })}
          <div className="ml-auto flex gap-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="px-2 py-1 rounded-lg text-xs transition-all"
                style={
                  isActive(item)
                    ? { backgroundColor: primaryColor + '18', color: primaryColor, fontWeight: 600 }
                    : { color: '#9CA3AF' }
                }
              >
                {item.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
