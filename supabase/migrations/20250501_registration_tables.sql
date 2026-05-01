-- Create businesses table if not exists
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  location VARCHAR(255),
  team_size VARCHAR(50),
  business_stage VARCHAR(50),
  target_audience VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create business_registrations table to store registration data
CREATE TABLE IF NOT EXISTS business_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),

  -- Goals & Challenges
  goals JSONB DEFAULT '[]',
  challenges JSONB DEFAULT '[]',
  monthly_customers VARCHAR(50),
  social_media JSONB DEFAULT '[]',

  -- Features
  selected_features JSONB DEFAULT '[]',

  -- Customization
  app_name VARCHAR(255),
  style_preset_id VARCHAR(100),
  primary_color VARCHAR(7),
  accent_color VARCHAR(7),
  bg_color VARCHAR(7),
  theme VARCHAR(20),
  font_style VARCHAR(50),
  layout_style VARCHAR(50),
  button_style VARCHAR(50),

  -- Status
  status VARCHAR(50) DEFAULT 'pending_email_verification',
  -- Status values: pending_email_verification, completed, cancelled

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_business_registrations_email ON business_registrations(email);
CREATE INDEX IF NOT EXISTS idx_business_registrations_business_id ON business_registrations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_registrations_user_id ON business_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_business_registrations_status ON business_registrations(status);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);

-- Create design_presets table for storing design presets
CREATE TABLE IF NOT EXISTS design_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline TEXT,

  -- Colors
  primary_color VARCHAR(7),
  accent_color VARCHAR(7),
  background_color VARCHAR(7),
  surface_color VARCHAR(7),
  text_primary VARCHAR(7),
  text_secondary VARCHAR(7),

  -- Theme
  theme VARCHAR(20),

  -- Typography & Layout
  font_style VARCHAR(50),
  layout_style VARCHAR(50),
  button_style VARCHAR(50),

  -- Gradients
  grad_from VARCHAR(7),
  grad_to VARCHAR(7),

  -- Metadata
  mood VARCHAR(100),
  popularity INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(category, name)
);

-- Create index for preset lookups
CREATE INDEX IF NOT EXISTS idx_design_presets_category ON design_presets(category);
CREATE INDEX IF NOT EXISTS idx_design_presets_featured ON design_presets(is_featured);

-- Add RLS (Row Level Security) policies
ALTER TABLE business_registrations ENABLE ROW LEVEL SECURITY;

-- Allow users to view/edit their own registration
CREATE POLICY "Users can view own registration" ON business_registrations
  FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update own registration" ON business_registrations
  FOR UPDATE
  USING (user_id = auth.uid());

-- Allow service role to insert/update (for registration API)
CREATE POLICY "Service role can manage registrations" ON business_registrations
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    current_user_id() = '{}'::"uuid"
  );

-- Allow public to insert new registrations
CREATE POLICY "Public can insert registration" ON business_registrations
  FOR INSERT
  WITH CHECK (TRUE);

ALTER TABLE design_presets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view design presets
CREATE POLICY "Anyone can view design presets" ON design_presets
  FOR SELECT
  USING (TRUE);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Allow owners to view their business
CREATE POLICY "Users can view own business" ON businesses
  FOR SELECT
  USING (TRUE);

-- Insert some sample design presets
INSERT INTO design_presets (
  category, name, tagline, primary_color, accent_color,
  background_color, theme, font_style, layout_style,
  button_style, grad_from, grad_to, mood, is_featured
) VALUES
  ('Restaurant', 'Rustic Kitchen', 'Warm, homey, and inviting',
   '#8B4513', '#FFB347', '#FDF5E6', 'light', 'classic', 'card',
   'rounded', '#8B4513', '#FFB347', '🏡 Warm & Cozy', TRUE),
  ('Restaurant', 'Modern Bistro', 'Charcoal, fresh, contemporary',
   '#2D2D2D', '#A8E063', '#FFFFFF', 'light', 'modern', 'hero',
   'square', '#2D2D2D', '#A8E063', '🌿 Fresh & Modern', FALSE),
  ('Restaurant', 'Fine Dining', 'Midnight elegance, gold accents',
   '#C8A951', '#F5F5F0', '#1A1A2E', 'dark', 'elegant', 'minimal',
   'pill', '#1A1A2E', '#C8A951', '✦ Fine & Elegant', TRUE),
  ('Salon & Spa', 'Serene Sanctuary', 'Calming, peaceful, luxurious',
   '#8B7355', '#D4A574', '#FBF7F3', 'light', 'elegant', 'card',
   'pill', '#8B7355', '#D4A574', '✨ Spa Vibes', TRUE),
  ('Fitness & Gym', 'Energetic', 'Bold, motivating, powerful',
   '#1E3A8A', '#FACC15', '#FFFFFF', 'light', 'bold', 'hero',
   'rounded', '#1E3A8A', '#FACC15', '⚡ High Energy', TRUE),
  ('Healthcare', 'Professional', 'Trust, care, professional',
   '#059669', '#3B82F6', '#FFFFFF', 'light', 'modern', 'minimal',
   'rounded', '#059669', '#3B82F6', '❤️ Care & Trust', TRUE)
ON CONFLICT (category, name) DO NOTHING;

-- Create a helper function to get current user id
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT auth.uid()
$$ LANGUAGE SQL STABLE;
