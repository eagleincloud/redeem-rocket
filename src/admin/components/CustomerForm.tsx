import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import type { Customer, CreateCustomerInput } from '../lib/customersService';
import { AlertCircle, Check } from 'lucide-react';

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CreateCustomerInput) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  onCancel?: () => void;
}

export function CustomerForm({
  customer,
  onSubmit,
  isLoading = false,
  error,
  onCancel,
}: CustomerFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCustomerInput>({
    defaultValues: customer
      ? {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          status: customer.status,
        }
      : {
          name: '',
          email: '',
          phone: '',
          status: 'active',
        },
  });

  const handleFormSubmit = async (data: CreateCustomerInput) => {
    try {
      await onSubmit(data);
      setSubmitted(true);
      reset();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
        <CardDescription>
          {customer ? 'Update customer information' : 'Add a new customer to the system'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {submitted && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">
                {customer ? 'Customer updated successfully' : 'Customer created successfully'}
              </p>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
            <Input
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
              placeholder="Customer name"
              disabled={isLoading}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
            <Input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              placeholder="customer@example.com"
              disabled={isLoading}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
            <Input
              {...register('phone', {
                required: 'Phone is required',
                pattern: {
                  value: /^[0-9+\-\s()]+$/,
                  message: 'Invalid phone number',
                },
              })}
              placeholder="+91 9876543210"
              disabled={isLoading}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {/* Status Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status *</label>
            <select
              {...register('status', { required: 'Status is required' })}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
