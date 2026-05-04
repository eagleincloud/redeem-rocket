import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Shield, Mail, Lock, Trash2 } from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  createdAt: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'suspended';
}

// Glassmorphic card component
const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg ${className}`}>
    {children}
  </div>
);

export const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'moderator'>(
    'all'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>(
    'all'
  );

  const [adminUsers] = useState<AdminUser[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@admin.redeeemrocket.com',
      role: 'super_admin',
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael@admin.redeeemrocket.com',
      role: 'admin',
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily@admin.redeeemrocket.com',
      role: 'moderator',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david@admin.redeeemrocket.com',
      role: 'moderator',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'inactive',
    },
  ]);

  const filteredUsers = useMemo(() => {
    return adminUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [adminUsers, searchTerm, roleFilter, statusFilter]);

  const relativeTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return `${Math.floor(d / 7)}w ago`;
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return '#8B5CF6';
      case 'admin':
        return '#3B82F6';
      case 'moderator':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'inactive':
        return '#6B7280';
      case 'suspended':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Users</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage admin team members and permissions</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Admins', value: adminUsers.length, color: '#FF9E1B' },
            {
              label: 'Active',
              value: adminUsers.filter((u) => u.status === 'active').length,
              color: '#10B981',
            },
            {
              label: 'Inactive',
              value: adminUsers.filter((u) => u.status === 'inactive').length,
              color: '#6B7280',
            },
            {
              label: 'Suspended',
              value: adminUsers.filter((u) => u.status === 'suspended').length,
              color: '#EF4444',
            },
          ].map((stat) => (
            <GlassCard key={stat.label} className="p-6">
              <div className="flex flex-col gap-1">
                <p className="m-0 text-xs text-muted-foreground">
                  {stat.label}
                </p>
                <p
                  className="m-0 text-2xl font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Filters */}
        <GlassCard className="p-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg backdrop-blur-md bg-white/5 border border-white/10">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none text-foreground text-sm outline-none placeholder-muted-foreground"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-6 flex-wrap">
              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground font-semibold">
                  Role:
                </span>
                <div className="flex gap-1">
                  {(['all', 'super_admin', 'admin', 'moderator'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                        roleFilter === role
                          ? 'bg-primary/90 text-primary-foreground border border-primary'
                          : 'bg-white/10 border border-white/20 text-muted-foreground hover:text-foreground hover:bg-white/20'
                      }`}
                    >
                      {role === 'all'
                        ? 'All'
                        : role === 'super_admin'
                          ? 'Super Admin'
                          : role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground font-semibold">
                  Status:
                </span>
                <div className="flex gap-1">
                  {(['all', 'active', 'inactive', 'suspended'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                        statusFilter === status
                          ? 'bg-primary/90 text-primary-foreground border border-primary'
                          : 'bg-white/10 border border-white/20 text-muted-foreground hover:text-foreground hover:bg-white/20'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Users Table */}
        <GlassCard>
          <div className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="text-center p-16 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        User
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Last Active
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="m-0 text-foreground font-semibold">
                              {user.name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="inline-block px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: `${getRoleBadgeColor(user.role)}20`,
                              color: getRoleBadgeColor(user.role),
                            }}
                          >
                            {user.role === 'super_admin'
                              ? 'Super Admin'
                              : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {relativeTime(user.lastActive)}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="inline-block px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: `${getStatusBadgeColor(user.status)}20`,
                              color: getStatusBadgeColor(user.status),
                            }}
                          >
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              className="text-blue-600 hover:text-blue-700 p-1 transition-colors"
                              title="Edit user"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              className="text-purple-600 hover:text-purple-700 p-1 transition-colors"
                              title="Reset password"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-700 p-1 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdminUsers;
