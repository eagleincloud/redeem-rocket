import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { useAuthAdmin } from '@/admin/context/AdminContext';
import { supabase } from '@/app/lib/supabase';
import { BarChart3, Users, Building2, LogOut, Settings, Search, ArrowRight } from 'lucide-react';

interface BusinessSummary {
  id: string;
  name: string;
  owner_email: string;
  owner_name: string;
  is_approved?: boolean;
  created_at: string;
  plan?: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthAdmin();
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalBusinesses: 0, activeBusinesses: 0 });

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  // Load businesses data
  useEffect(() => {
    const loadBusinesses = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Get businesses with owner info
        const { data, error } = await supabase
          .from('businesses')
          .select(`
            id,
            name,
            is_approved,
            created_at,
            owner_id
          `)
          .limit(50)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get owner info for each business
        const withOwners = await Promise.all(
          (data || []).map(async (business) => {
            const { data: owner } = await supabase
              .from('biz_users')
              .select('email, name')
              .eq('id', business.owner_id)
              .single();

            return {
              id: business.id,
              name: business.name,
              owner_email: owner?.email || 'N/A',
              owner_name: owner?.name || 'Unknown',
              is_approved: business.is_approved,
              created_at: business.created_at,
            };
          })
        );

        setBusinesses(withOwners);
        setStats({
          totalBusinesses: withOwners.length,
          activeBusinesses: withOwners.filter(b => b.is_approved).length,
        });
      } catch (err) {
        console.error('Failed to load businesses:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, []);

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">Manage businesses and users</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-md transition cursor-pointer" onClick={() => navigate('/admin/customers')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Manage Customers
              </CardTitle>
              <CardDescription>View, add, edit, and delete customers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Go to Customers <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition cursor-pointer" onClick={() => navigate('#')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                Manage Businesses
              </CardTitle>
              <CardDescription>View and manage business accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Go to Businesses <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Total Businesses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.totalBusinesses}</div>
              <p className="text-xs text-slate-500 mt-2">Registered on platform</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                Active Businesses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.activeBusinesses}</div>
              <p className="text-xs text-slate-500 mt-2">Approved and active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats.totalBusinesses - stats.activeBusinesses}
              </div>
              <p className="text-xs text-slate-500 mt-2">Awaiting verification</p>
            </CardContent>
          </Card>
        </div>

        {/* Businesses Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Businesses</CardTitle>
                <CardDescription>Manage all registered businesses</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-slate-500">Loading businesses...</p>
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No businesses found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-sm text-slate-700">
                        Business Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-slate-700">
                        Owner
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-slate-700">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-slate-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-slate-700">
                        Created
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-slate-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBusinesses.map((business) => (
                      <tr key={business.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                          {business.name}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">{business.owner_name}</td>
                        <td className="py-3 px-4 text-sm text-slate-700">{business.owner_email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              business.is_approved
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {business.is_approved ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">
                          {new Date(business.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/businesses/${business.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default AdminDashboard;
