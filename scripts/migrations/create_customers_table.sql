-- Create customers table for admin management
-- Run this in Supabase SQL Editor or using supabase migration commands

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- Create trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customers_updated_at ON customers;
CREATE TRIGGER trigger_update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_customers_updated_at();

-- Enable Row Level Security (RLS) - optional but recommended for security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated admin users
-- This assumes you have admin_users table or similar
-- Adjust the policies based on your authentication setup

-- Allow authenticated admins to read all customers
CREATE POLICY "Allow authenticated admins to read customers"
  ON customers FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated admins to create customers
CREATE POLICY "Allow authenticated admins to create customers"
  ON customers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated admins to update customers
CREATE POLICY "Allow authenticated admins to update customers"
  ON customers FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated admins to delete customers
CREATE POLICY "Allow authenticated admins to delete customers"
  ON customers FOR DELETE
  USING (auth.role() = 'authenticated');

-- Sample data (optional - for testing)
-- INSERT INTO customers (name, email, phone, status) VALUES
-- ('John Doe', 'john@example.com', '+91 9876543210', 'active'),
-- ('Jane Smith', 'jane@example.com', '+91 9123456789', 'active'),
-- ('Bob Johnson', 'bob@example.com', '+91 8765432109', 'inactive');
