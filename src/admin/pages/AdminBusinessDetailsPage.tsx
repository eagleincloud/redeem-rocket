import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { supabase } from '@/app/lib/supabase';
import { useAuthAdmin } from '@/admin/context/AdminContext';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Mail, User, CheckCircle2, XCircle, Save, X } from 'lucide-react';

interface BusinessDetails {
  id: string;
  name: string;
  owner_id: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  is_approved?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

interface OwnerInfo {
  id: string;
  name: string;
  email: string;
}

interface FormData {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export function AdminBusinessDetailsPage() {
  const navigate = useNavigate();
  const { businessId } = useParams<{ businessId: string }>();
  const { user } = useAuthAdmin();

  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  // Load business details
  useEffect(() => {
    const loadBusiness = async () => {
      if (!businessId || !supabase) {
        setLoading(false);
        return;
      }

      try {
        // Get business details
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();

        if (businessError) throw businessError;

        if (businessData) {
          setBusiness(businessData);

          // Get owner details
          if (businessData.owner_id) {
            const { data: ownerData } = await supabase
              .from('biz_users')
              .select('id, name, email')
              .eq('id', businessData.owner_id)
              .single();

            if (ownerData) {
              setOwner(ownerData);
            }
          }

          // Reset form with business data
          reset({
            name: businessData.name || '',
            description: businessData.description || '',
            address: businessData.address || '',
            city: businessData.city || '',
            state: businessData.state || '',
            postal_code: businessData.postal_code || '',
            phone: businessData.phone || '',
            email: businessData.email || '',
            website: businessData.website || '',
          });
        }
      } catch (err) {
        console.error('Failed to load business:', err);
        toast.error('Failed to load business details');
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [businessId, reset]);

  const onSubmit = async (formData: FormData) => {
    if (!businessId || !supabase) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (error) throw error;

      // Update local state
      setBusiness(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
      toast.success('Business details updated successfully');
    } catch (err) {
      console.error('Failed to update business:', err);
      toast.error('Failed to update business details');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleApprovalStatus = async () => {
    if (!businessId || !supabase || !business) return;

    try {
      const newStatus = !business.is_approved;
      const { error } = await supabase
        .from('businesses')
        .update({ is_approved: newStatus })
        .eq('id', businessId);

      if (error) throw error;

      setBusiness(prev => prev ? { ...prev, is_approved: newStatus } : null);
      toast.success(`Business ${newStatus ? 'approved' : 'unapproved'} successfully`);
    } catch (err) {
      console.error('Failed to update approval status:', err);
      toast.error('Failed to update approval status');
    }
  };

  const handleBack = () => {
    navigate('/admin/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-slate-500">Loading business details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">Business not found. It may have been deleted.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                variant="default"
                onClick={() => setIsEditing(true)}
              >
                Edit Details
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{business.name}</CardTitle>
                  <CardDescription className="mt-2">
                    Created on {new Date(business.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <div className="flex items-center gap-2">
                  {business.is_approved ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Approved</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-700">Pending</span>
                    </>
                  )}
                </div>
                <Button
                  variant={business.is_approved ? 'destructive' : 'default'}
                  size="sm"
                  onClick={toggleApprovalStatus}
                  className="mt-2"
                >
                  {business.is_approved ? 'Unapprove' : 'Approve'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Owner Information */}
        {owner && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Owner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Owner Name</p>
                  <p className="text-slate-900">{owner.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Owner Email</p>
                  <p className="text-slate-900">{owner.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Details Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>
                  {isEditing ? 'Edit business information' : 'Business information'}
                </CardDescription>
              </div>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    reset();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Business Name */}
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Business Name *
                </Label>
                <Input
                  id="name"
                  disabled={!isEditing}
                  {...register('name', { required: 'Business name is required' })}
                  className="mt-2"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  disabled={!isEditing}
                  {...register('description')}
                  className="mt-2"
                  rows={4}
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    disabled={!isEditing}
                    {...register('email')}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    disabled={!isEditing}
                    {...register('phone')}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <Label htmlFor="website" className="text-sm font-medium">
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  disabled={!isEditing}
                  {...register('website')}
                  className="mt-2"
                />
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address" className="text-sm font-medium">
                  Address
                </Label>
                <Input
                  id="address"
                  disabled={!isEditing}
                  {...register('address')}
                  className="mt-2"
                />
              </div>

              {/* City, State, Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    disabled={!isEditing}
                    {...register('city')}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm font-medium">
                    State
                  </Label>
                  <Input
                    id="state"
                    disabled={!isEditing}
                    {...register('state')}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code" className="text-sm font-medium">
                    Postal Code
                  </Label>
                  <Input
                    id="postal_code"
                    disabled={!isEditing}
                    {...register('postal_code')}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default AdminBusinessDetailsPage;
