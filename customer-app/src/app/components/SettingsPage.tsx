import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { getAppData, saveAppData, clearAppData } from '../utils/appState';
import { categoryData, getPresetById } from '../utils/categoryStyles';
import { getSession, logout, updatePassword, updateName } from '../utils/auth';
import { toast } from 'sonner';
import {
  User, Bell, Shield, Palette, Globe, Smartphone, Trash2,
  CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Eye,
  Download, Upload, ChevronRight, Lock, LogOut, KeyRound,
} from 'lucide-react';

const notifSettings = [
  { id: 'new_leads', label: 'New Lead Alerts', desc: 'Get notified when a new lead is added', default: true },
  { id: 'campaign_results', label: 'Campaign Results', desc: 'Weekly campaign performance summary', default: true },
  { id: 'conversions', label: 'Conversion Milestones', desc: 'Celebrate when leads convert', default: true },
  { id: 'system_updates', label: 'System Updates', desc: 'App updates and new features', default: false },
  { id: 'marketing_tips', label: 'Marketing Tips', desc: 'Weekly tips to grow your business', default: false },
];

const integrations = [
  { id: 'whatsapp', name: 'WhatsApp Business', icon: '💬', connected: true, color: '#25D366' },
  { id: 'google', name: 'Google Business', icon: '🔍', connected: true, color: '#4285F4' },
  { id: 'instagram', name: 'Instagram', icon: '📸', connected: false, color: '#E1306C' },
  { id: 'facebook', name: 'Facebook Ads', icon: '📘', connected: false, color: '#1877F2' },
  { id: 'razorpay', name: 'Razorpay', icon: '💳', connected: false, color: '#3395FF' },
  { id: 'shiprocket', name: 'Shiprocket', icon: '🚚', connected: false, color: '#FF6B35' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [appData, setAppData] = useState<any>(null);
  const [preset, setPreset] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  // Profile
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  // Account
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState<Record<string, boolean>>({});

  // Reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const data = getAppData();
    setAppData(data);
    setBusinessName(data.businessName || '');
    setEmail(data.email || '');
    setPhone(data.phone || '');
    setLocation(data.location || '');

    const s = getSession();
    setSession(s);
    setDisplayName(s?.name || '');

    const defaults: Record<string, boolean> = {};
    notifSettings.forEach(n => { defaults[n.id] = n.default; });
    setNotifs(defaults);

    if (data.category && data.stylePresetId) {
      setPreset(getPresetById(data.category, data.stylePresetId));
    }
  }, []);

  const catInfo = appData?.category
    ? (categoryData[appData.category] ?? categoryData['Other'])
    : categoryData['Other'];
  const primaryColor = preset?.primary ?? '#3B82F6';
  const accentColor = preset?.accent ?? '#8B5CF6';

  const handleSaveBusiness = () => {
    saveAppData({ businessName, email, phone, location });
    toast.success('Business profile saved!', { description: 'Your changes have been applied.' });
  };

  const handleSaveName = () => {
    if (!displayName.trim()) { toast.error('Name cannot be empty.'); return; }
    if (session?.userId) {
      updateName(session.userId, displayName);
      setSession((s: any) => ({ ...s, name: displayName }));
      toast.success('Display name updated!');
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (!session?.userId) { toast.error('Session error. Please re-login.'); return; }
    const result = updatePassword(session.userId, currentPassword, newPassword);
    if (!result.success) {
      toast.error(result.error ?? 'Password update failed.');
    } else {
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReset = () => {
    clearAppData();
    toast.success('App data cleared', { description: 'Redirecting to onboarding...' });
    setTimeout(() => navigate('/details'), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: '1.5rem' }}>Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your account, app configuration and preferences</p>
      </div>

      {/* App Health Banner */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-center gap-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
      >
        <div style={{
          position: 'absolute', right: -20, top: -20, width: 120, height: 120,
          borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)',
        }} />
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1rem' }}>
            Your app is healthy ✅
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
            {catInfo.emoji} {appData?.category || 'Business'} • {appData?.selectedFeatures?.length || 0} features active
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => navigate('/preview')}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-white text-sm transition-all"
            style={{ fontWeight: 600 }}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => navigate('/customize')}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-white text-sm transition-all"
            style={{ fontWeight: 600 }}
          >
            <Palette className="w-3.5 h-3.5" /> Redesign
          </button>
        </div>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="mb-6 bg-white border border-gray-100 shadow-sm rounded-xl p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="account" className="rounded-lg gap-1.5">
            <User className="w-3.5 h-3.5" /> Account
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Business
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg gap-1.5">
            <Bell className="w-3.5 h-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-lg gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="app" className="rounded-lg gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> App
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Security
          </TabsTrigger>
        </TabsList>

        {/* ─── Account Tab ─────────────────────────────────────────────── */}
        <TabsContent value="account">
          <div className="space-y-5">
            {/* User profile card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle style={{ fontSize: '1rem' }}>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar + name */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, fontSize: '1.6rem', fontWeight: 800 }}
                  >
                    {session?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-gray-900" style={{ fontWeight: 700, fontSize: '1rem' }}>{session?.name || 'User'}</p>
                    <p className="text-gray-500 text-sm">{session?.email || '—'}</p>
                    <Badge className="mt-1 text-xs bg-green-100 text-green-700 border-0">Active Account</Badge>
                  </div>
                </div>

                {/* Edit display name */}
                <div>
                  <Label htmlFor="display-name">Display Name</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="h-11 flex-1"
                      placeholder="Your full name"
                    />
                    <Button
                      onClick={handleSaveName}
                      className="gap-2 text-white h-11 px-4"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Email Address</Label>
                  <div className="mt-2 h-11 px-3 flex items-center bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm">
                    {session?.email || '—'}
                    <Badge className="ml-auto text-xs bg-blue-50 text-blue-600 border-0">Verified</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change password */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-gray-500" />
                  <CardTitle style={{ fontSize: '1rem' }}>Change Password</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cur-pwd">Current Password</Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="cur-pwd"
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="pl-10 h-11"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-pwd">New Password</Label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="new-pwd"
                        type={showNewPwd ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="pl-10 h-11"
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="conf-pwd">Confirm New Password</Label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="conf-pwd"
                        type="password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        className="pl-10 h-11"
                        placeholder="Repeat new password"
                      />
                      {confirmNewPassword && newPassword === confirmNewPassword && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    onClick={handleChangePassword}
                    className="gap-2 text-white"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  >
                    <KeyRound className="w-4 h-4" /> Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>Sign Out</p>
                    <p className="text-gray-500 text-xs mt-0.5">Log out from this device</p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Business Profile Tab ─────────────────────────────────────── */}
        <TabsContent value="profile">
          <div className="space-y-5">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle style={{ fontSize: '1rem' }}>Business Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, fontSize: '1.8rem' }}
                  >
                    {catInfo.emoji}
                  </div>
                  <div>
                    <div className="text-gray-900" style={{ fontWeight: 700, fontSize: '1rem' }}>{businessName || 'Your Business'}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-xs bg-green-100 text-green-700 border-0">
                        {appData?.category || 'Business'}
                      </Badge>
                      {preset && (
                        <Badge variant="secondary" className="text-xs">
                          {preset.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto gap-1.5"
                    onClick={() => navigate('/customize')}
                  >
                    <Palette className="w-3.5 h-3.5" /> Change Style
                  </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="biz-name">Business Name</Label>
                    <Input
                      id="biz-name"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      className="mt-2 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="biz-email">Email Address</Label>
                    <Input
                      id="biz-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="mt-2 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="biz-phone">Phone Number</Label>
                    <Input
                      id="biz-phone"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="mt-2 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="biz-location">Location</Label>
                    <Input
                      id="biz-location"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="mt-2 h-11"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveBusiness}
                    className="gap-2 text-white"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* App Summary */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle style={{ fontSize: '1rem' }}>App Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Category', value: appData?.category || '—', icon: catInfo.emoji },
                    { label: 'Style Preset', value: preset?.name || 'Default', icon: '🎨' },
                    { label: 'Features Active', value: `${appData?.selectedFeatures?.length || 0} features`, icon: '⚡' },
                    { label: 'Business Stage', value: appData?.businessStage || '—', icon: '📈' },
                    { label: 'Team Size', value: appData?.teamSize || '—', icon: '👥' },
                    { label: 'Target Audience', value: appData?.targetAudience || '—', icon: '🎯' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-lg mb-1">{item.icon}</div>
                      <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
                      <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Notifications Tab ───────────────────────────────────────── */}
        <TabsContent value="notifications">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle style={{ fontSize: '1rem' }}>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {notifSettings.map(n => (
                <div
                  key={n.id}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all"
                >
                  <div className="flex-1">
                    <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{n.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{n.desc}</div>
                  </div>
                  <Switch
                    checked={notifs[n.id] ?? n.default}
                    onCheckedChange={val => setNotifs(prev => ({ ...prev, [n.id]: val }))}
                  />
                </div>
              ))}
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={() => toast.success('Notification settings saved!')}
                  className="gap-2 text-white"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Integrations Tab ────────────────────────────────────────── */}
        <TabsContent value="integrations">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle style={{ fontSize: '1rem' }}>Connected Integrations</CardTitle>
                <Badge className="bg-blue-100 text-blue-700 border-0">
                  {integrations.filter(i => i.connected).length} / {integrations.length} connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {integrations.map(integ => (
                  <div
                    key={integ.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: integ.color + '18' }}
                    >
                      {integ.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{integ.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${integ.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs" style={{ color: integ.connected ? '#10B981' : '#9CA3AF' }}>
                          {integ.connected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant={integ.connected ? 'outline' : 'default'}
                      size="sm"
                      className="gap-1.5"
                      style={!integ.connected ? { backgroundColor: integ.color, color: '#FFFFFF', border: 'none' } : {}}
                      onClick={() => toast.info(integ.connected ? `Manage ${integ.name}` : `Connecting to ${integ.name}...`)}
                    >
                      {integ.connected ? (
                        <>Manage <ExternalLink className="w-3 h-3" /></>
                      ) : (
                        <>Connect <ChevronRight className="w-3 h-3" /></>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── App Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="app">
          <div className="space-y-5">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle style={{ fontSize: '1rem' }}>App Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Re-customize App Style', desc: 'Change colours, fonts and layout presets', icon: Palette, action: () => navigate('/customize') },
                    { label: 'Preview Customer App', desc: 'See what your customers will experience', icon: Eye, action: () => navigate('/preview') },
                    { label: 'Update Features', desc: 'Add or remove app features', icon: RefreshCw, action: () => navigate('/features') },
                    { label: 'Download App Config', desc: 'Export your app configuration as JSON', icon: Download, action: () => toast.info('Exporting configuration...') },
                    { label: 'Import Config', desc: 'Restore from a backup configuration file', icon: Upload, action: () => toast.info('Import feature coming soon') },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        onClick={item.action}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-left"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: primaryColor + '18' }}
                        >
                          <Icon className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{item.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Security Tab ────────────────────────────────────────────── */}
        <TabsContent value="security">
          <div className="space-y-5">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle style={{ fontSize: '1rem' }}>Security & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Two-Factor Authentication', desc: '2FA is enabled for your account', enabled: true },
                  { label: 'Login Notifications', desc: 'Get alerted on new logins', enabled: true },
                  { label: 'Data Encryption', desc: 'All customer data is encrypted at rest', enabled: true },
                  { label: 'Activity Logging', desc: 'Track all actions on your account', enabled: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{item.label}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                    </div>
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={() => toast.info('Security settings updated')}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-0 shadow-sm border-red-100">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <CardTitle style={{ fontSize: '1rem', color: '#EF4444' }}>Danger Zone</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="text-sm text-red-900" style={{ fontWeight: 600 }}>Reset App Data</div>
                  <div className="text-xs text-red-700 mt-1 mb-3">
                    This will clear all your app configuration, features and customization. You will be taken back to the onboarding flow. This action cannot be undone.
                  </div>
                  {!showResetConfirm ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => setShowResetConfirm(true)}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Reset App Data
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleReset}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Yes, Reset Everything
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowResetConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
