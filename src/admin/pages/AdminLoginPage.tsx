import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { adminLoginWithPassword } from '@/admin/lib/adminAuthService';
import { useAuthAdmin } from '@/admin/context/AdminContext';
import { AlertCircle, Loader2, Eye, EyeOff, Shield } from 'lucide-react';

interface AdminLoginPageProps {
  onSuccess?: () => void;
}

export function AdminLoginPage({ onSuccess }: AdminLoginPageProps) {
  const navigate = useNavigate();
  const { setUser } = useAuthAdmin();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await adminLoginWithPassword(email, password);

      if (!result.ok) {
        setError(result.error || 'Login failed');
        return;
      }

      if (!result.user) {
        setError('Login failed - no user data returned');
        return;
      }

      // Set admin user in context and localStorage
      const adminData = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        status: result.user.status,
      };

      setUser(adminData);
      localStorage.setItem('admin_user', JSON.stringify(adminData));
      setSuccessMessage('Login successful!');

      setTimeout(() => {
        onSuccess?.();
        navigate('/admin/');
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-700">
        <CardHeader className="space-y-2 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-slate-700" />
            <span className="text-xl font-bold text-slate-700">Admin Portal</span>
          </div>
          <CardTitle className="text-center text-slate-900">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm mb-4 border border-green-200">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600">
                <strong>Demo Credentials:</strong> Use test credentials provided by your administrator
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-xs text-slate-500">
              If you forgot your password, contact your administrator
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminLoginPage;
