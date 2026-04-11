import { supabase } from '@/app/lib/supabase';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'inactive';
}

/**
 * Fetch all customers with optional filters
 */
export async function fetchCustomers(
  limit = 50,
  offset = 0,
  searchTerm?: string
): Promise<{ customers: Customer[]; total: number; error?: string }> {
  if (!supabase) {
    return { customers: [], total: 0, error: 'Supabase not configured' };
  }

  try {
    let query = supabase.from('customers').select('*', { count: 'exact' });

    if (searchTerm) {
      // Search across name, email, and phone
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch customers:', error);
      return { customers: [], total: 0, error: error.message };
    }

    return {
      customers: (data || []) as Customer[],
      total: count || 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching customers:', message);
    return { customers: [], total: 0, error: message };
  }
}

/**
 * Fetch a single customer by ID
 */
export async function fetchCustomerById(id: string): Promise<{ customer: Customer | null; error?: string }> {
  if (!supabase) {
    return { customer: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch customer:', error);
      return { customer: null, error: error.message };
    }

    return { customer: data as Customer };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching customer:', message);
    return { customer: null, error: message };
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(
  input: CreateCustomerInput
): Promise<{ customer: Customer | null; error?: string }> {
  if (!supabase) {
    return { customer: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          name: input.name,
          email: input.email,
          phone: input.phone,
          status: input.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create customer:', error);
      return { customer: null, error: error.message };
    }

    return { customer: data as Customer };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error creating customer:', message);
    return { customer: null, error: message };
  }
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput
): Promise<{ customer: Customer | null; error?: string }> {
  if (!supabase) {
    return { customer: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update customer:', error);
      return { customer: null, error: error.message };
    }

    return { customer: data as Customer };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error updating customer:', message);
    return { customer: null, error: message };
  }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase.from('customers').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete customer:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error deleting customer:', message);
    return { success: false, error: message };
  }
}

/**
 * Get customer statistics
 */
export async function getCustomerStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  error?: string;
}> {
  if (!supabase) {
    return { total: 0, active: 0, inactive: 0, error: 'Supabase not configured' };
  }

  try {
    const { data: allCustomers, error } = await supabase
      .from('customers')
      .select('status', { count: 'exact' });

    if (error) {
      console.error('Failed to fetch stats:', error);
      return { total: 0, active: 0, inactive: 0, error: error.message };
    }

    const customers = allCustomers || [];
    const active = customers.filter((c) => c.status === 'active').length;
    const inactive = customers.filter((c) => c.status === 'inactive').length;

    return {
      total: customers.length,
      active,
      inactive,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching stats:', message);
    return { total: 0, active: 0, inactive: 0, error: message };
  }
}
