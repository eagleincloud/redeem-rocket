import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { useAuthAdmin } from '@/admin/context/AdminContext';
import { CustomerForm } from '@/admin/components/CustomerForm';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  type Customer,
  type CreateCustomerInput,
} from '@/admin/lib/customersService';
import {
  Users,
  LogOut,
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type ModalType = 'add' | 'edit' | 'delete' | null;

export function AdminCustomersPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthAdmin();

  // Auth check
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Modal states
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Load customers
  const loadCustomers = async () => {
    setLoading(true);
    const offset = (currentPage - 1) * pageSize;
    const { customers: data, total, error } = await fetchCustomers(pageSize, offset, searchTerm);

    if (error) {
      console.error(error);
    } else {
      setCustomers(data);
      setTotalPages(Math.ceil(total / pageSize));
    }
    setLoading(false);
  };

  // Load stats
  const loadStats = async () => {
    const stats = await getCustomerStats();
    setStats(stats);
  };

  // Initial load
  useEffect(() => {
    loadCustomers();
    loadStats();
  }, [currentPage, searchTerm]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to page 1 on search
  };

  // Handle add customer
  const handleAddCustomer = async (data: CreateCustomerInput) => {
    setFormError('');
    setFormLoading(true);
    const { error } = await createCustomer(data);

    if (error) {
      setFormError(error);
    } else {
      setModalType(null);
      await loadCustomers();
      await loadStats();
    }
    setFormLoading(false);
  };

  // Handle edit customer
  const handleEditCustomer = async (data: CreateCustomerInput) => {
    if (!selectedCustomer) return;

    setFormError('');
    setFormLoading(true);
    const { error } = await updateCustomer(selectedCustomer.id, data);

    if (error) {
      setFormError(error);
    } else {
      setModalType(null);
      setSelectedCustomer(null);
      await loadCustomers();
      await loadStats();
    }
    setFormLoading(false);
  };

  // Handle delete customer
  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;

    setDeleteError('');
    setFormLoading(true);
    const { error } = await deleteCustomer(selectedCustomer.id);

    if (error) {
      setDeleteError(error);
    } else {
      setModalType(null);
      setSelectedCustomer(null);
      await loadCustomers();
      await loadStats();
    }
    setFormLoading(false);
  };

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
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Customers</h1>
              <p className="text-sm text-slate-500">Manage all customers</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Back to Dashboard
            </button>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
              <p className="text-xs text-slate-500 mt-2">All registered customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                Active Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.active}</div>
              <p className="text-xs text-slate-500 mt-2">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-600" />
                Inactive Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.inactive}</div>
              <p className="text-xs text-slate-500 mt-2">Inactive accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Customers List</CardTitle>
                <CardDescription>Manage and view all customers</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => {
                    setModalType('add');
                    setFormError('');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 flex gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-slate-500">Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No customers found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-sm text-slate-700">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-slate-700">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-slate-700">
                          Phone
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
                      {customers.map((customer) => (
                        <tr key={customer.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">
                            {customer.name}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-700">{customer.email}</td>
                          <td className="py-3 px-4 text-sm text-slate-700">{customer.phone}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                customer.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {customer.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-700">
                            {new Date(customer.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setModalType('edit');
                                  setFormError('');
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setModalType('delete');
                                  setDeleteError('');
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit Modal */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {modalType === 'add' ? 'Add New Customer' : 'Edit Customer'}
              </h2>
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedCustomer(null);
                  setFormError('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <CustomerForm
                customer={modalType === 'edit' ? selectedCustomer || undefined : undefined}
                onSubmit={modalType === 'add' ? handleAddCustomer : handleEditCustomer}
                isLoading={formLoading}
                error={formError}
                onCancel={() => {
                  setModalType(null);
                  setSelectedCustomer(null);
                  setFormError('');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalType === 'delete' && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-slate-900">Delete Customer</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Are you sure you want to delete <strong>{selectedCustomer.name}</strong>? This
                    action cannot be undone.
                  </p>

                  {deleteError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex gap-3">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{deleteError}</p>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setModalType(null);
                        setSelectedCustomer(null);
                        setDeleteError('');
                      }}
                      disabled={formLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteConfirm}
                      disabled={formLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {formLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCustomersPage;
