/**
 * Registration API - Handles complete business registration flow
 * Endpoints:
 * POST /register/submit - Submit complete registration
 * POST /register/validate-email - Check if email is available
 * GET /register/presets/:category - Get design presets for category
 * POST /register/create-business - Create business account
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RegistrationData {
  // Business Basics
  businessName: string;
  email: string;
  phone: string;

  // Category & Profile
  category: string;
  location: string;
  teamSize: string;
  businessStage: string;
  targetAudience: string;

  // Goals & Challenges
  goals: string[];
  challenges: string[];
  monthlyCustomers: string;
  socialMedia: string[];

  // Feature Selection
  selectedFeatures: string[];

  // Customization
  appName: string;
  stylePresetId: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  theme: 'light' | 'dark';
  fontStyle: string;
  layoutStyle: string;
  buttonStyle: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // POST /register/submit - Save complete registration
    if (path === '/register/submit' && req.method === 'POST') {
      return await handleRegistrationSubmit(req);
    }

    // POST /register/validate-email - Check email availability
    if (path === '/register/validate-email' && req.method === 'POST') {
      return await handleEmailValidation(req);
    }

    // POST /register/create-business - Create business account
    if (path === '/register/create-business' && req.method === 'POST') {
      return await handleCreateBusiness(req);
    }

    // GET /register/presets/:category - Get design presets
    if (path.startsWith('/register/presets/') && req.method === 'GET') {
      const category = path.split('/')[3];
      return await handleGetPresets(category);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Registration API Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Handle complete registration submission
 */
async function handleRegistrationSubmit(req: Request) {
  const data: RegistrationData = await req.json();

  // Validate required fields
  if (!data.businessName || !data.email || !data.category || !data.selectedFeatures.length) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('biz_users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create business record
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: data.businessName,
        category: data.category,
        location: data.location,
        team_size: data.teamSize,
        business_stage: data.businessStage,
        target_audience: data.targetAudience,
      })
      .select()
      .single();

    if (businessError) throw businessError;

    // Create registration record
    const { data: registration, error: registrationError } = await supabase
      .from('business_registrations')
      .insert({
        business_id: business.id,
        email: data.email,
        phone: data.phone,
        goals: data.goals,
        challenges: data.challenges,
        monthly_customers: data.monthlyCustomers,
        social_media: data.socialMedia,
        selected_features: data.selectedFeatures,
        app_name: data.appName,
        style_preset_id: data.stylePresetId,
        primary_color: data.primaryColor,
        accent_color: data.accentColor,
        bg_color: data.bgColor,
        theme: data.theme,
        font_style: data.fontStyle,
        layout_style: data.layoutStyle,
        button_style: data.buttonStyle,
        status: 'pending_email_verification',
      })
      .select()
      .single();

    if (registrationError) throw registrationError;

    // TODO: Send verification email
    console.log('Registration created, ready for email verification:', registration.id);

    return new Response(
      JSON.stringify({
        success: true,
        registrationId: registration.id,
        businessId: business.id,
        message: 'Registration submitted. Please verify your email.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Validate email availability
 */
async function handleEmailValidation(req: Request) {
  const { email } = await req.json();

  if (!email || !email.includes('@')) {
    return new Response(
      JSON.stringify({ error: 'Invalid email' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const { data: existingUser } = await supabase
    .from('biz_users')
    .select('id')
    .eq('email', email)
    .single();

  return new Response(
    JSON.stringify({
      available: !existingUser,
      email: email,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create business account after email verification
 */
async function handleCreateBusiness(req: Request) {
  const { registrationId, userId } = await req.json();

  if (!registrationId || !userId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get registration record
    const { data: registration, error: regError } = await supabase
      .from('business_registrations')
      .select('*')
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      throw new Error('Registration not found');
    }

    // Update registration status
    const { error: updateError } = await supabase
      .from('business_registrations')
      .update({ status: 'completed', user_id: userId })
      .eq('id', registrationId);

    if (updateError) throw updateError;

    // Create biz_users record if needed
    const { data: bizUser } = await supabase
      .from('biz_users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!bizUser) {
      await supabase.from('biz_users').insert({
        id: userId,
        business_id: registration.business_id,
        email: registration.email,
        phone: registration.phone,
        feature_preferences: registration.selected_features,
        theme_preference: {
          layout: registration.layout_style,
          primary_color: registration.primary_color,
          secondary_color: registration.accent_color,
          logo_url: null,
          font_style: registration.font_style,
        },
        onboarding_completed_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Business account created successfully',
        businessId: registration.business_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Get design presets for a category
 */
async function handleGetPresets(category: string) {
  // This would typically come from database, but for now we can return hardcoded presets
  // In production, store presets in database: categories → design_presets table

  const presets: Record<string, any[]> = {
    restaurant: [
      {
        id: 'restaurant-rustic',
        name: 'Rustic Kitchen',
        tagline: 'Warm, homey, and inviting',
        primary: '#8B4513',
        accent: '#FFB347',
        theme: 'light',
        mood: '🏡 Warm & Cozy',
      },
      {
        id: 'restaurant-fine',
        name: 'Fine Dining',
        tagline: 'Midnight elegance, gold accents',
        primary: '#C8A951',
        accent: '#F5F5F0',
        theme: 'dark',
        mood: '✦ Fine & Elegant',
      },
    ],
    // Add more categories as needed
  };

  const categoryPresets = presets[category.toLowerCase()] || [];

  return new Response(
    JSON.stringify({
      category,
      presets: categoryPresets,
      count: categoryPresets.length,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
