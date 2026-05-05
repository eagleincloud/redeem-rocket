-- Redeem Rocket: Real-Time Chat System - Initial Data Setup
-- Run this in Supabase SQL Editor
-- Note: Must be run AFTER 010_chat_schema.sql and 011_chat_rls_policies.sql
-- Date: May 4, 2026

-- =============================================================================
-- 1. INITIALIZE BUSINESS_FEATURES FOR ALL EXISTING BUSINESSES
-- =============================================================================
-- Insert default chat features for all businesses
-- Chat is DISABLED by default (can be enabled per business via admin panel)

INSERT INTO public.business_features (
  business_id,
  chat_enabled,
  chat_tier,
  chat_max_messages_per_day,
  group_chat_enabled,
  file_sharing_enabled,
  created_at,
  updated_at
)
SELECT
  b.id,
  FALSE, -- Chat disabled by default
  'basic', -- Default tier
  1000, -- Default message limit
  FALSE, -- Group chat disabled
  TRUE, -- File sharing enabled
  NOW(),
  NOW()
FROM public.businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM public.business_features bf
  WHERE bf.business_id = b.id
)
ON CONFLICT (business_id) DO NOTHING;

-- =============================================================================
-- 2. INITIALIZE CHAT_ROLE_PERMISSIONS FOR ALL BUSINESSES
-- =============================================================================
-- Insert default permissions for each role in all businesses

DO $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Iterate through all businesses
  FOR v_business_id IN SELECT DISTINCT id FROM public.businesses
  LOOP
    -- Customer role permissions
    INSERT INTO public.chat_role_permissions (
      business_id,
      role,
      permissions
    )
    VALUES (
      v_business_id,
      'customer',
      jsonb_build_object(
        'can_initiate_chat', true,
        'can_message', true,
        'can_edit_own_message', true,
        'can_delete_own_message', true,
        'can_delete_any_message', false,
        'can_see_all_chats', false,
        'can_add_participants', false,
        'can_archive_conversation', true,
        'can_export_chat', false,
        'can_view_audit_logs', false
      )
    )
    ON CONFLICT (business_id, role) DO NOTHING;

    -- Merchant role permissions
    INSERT INTO public.chat_role_permissions (
      business_id,
      role,
      permissions
    )
    VALUES (
      v_business_id,
      'merchant',
      jsonb_build_object(
        'can_initiate_chat', true,
        'can_message', true,
        'can_edit_own_message', true,
        'can_delete_own_message', true,
        'can_delete_any_message', false,
        'can_see_all_chats', false,
        'can_add_participants', false,
        'can_archive_conversation', true,
        'can_export_chat', false,
        'can_view_audit_logs', false
      )
    )
    ON CONFLICT (business_id, role) DO NOTHING;

    -- Manager role permissions
    INSERT INTO public.chat_role_permissions (
      business_id,
      role,
      permissions
    )
    VALUES (
      v_business_id,
      'manager',
      jsonb_build_object(
        'can_initiate_chat', true,
        'can_message', true,
        'can_edit_own_message', true,
        'can_delete_own_message', true,
        'can_delete_any_message', true,
        'can_see_all_chats', true,
        'can_add_participants', true,
        'can_archive_conversation', true,
        'can_export_chat', true,
        'can_view_audit_logs', false
      )
    )
    ON CONFLICT (business_id, role) DO NOTHING;

    -- Admin role permissions
    INSERT INTO public.chat_role_permissions (
      business_id,
      role,
      permissions
    )
    VALUES (
      v_business_id,
      'admin',
      jsonb_build_object(
        'can_initiate_chat', true,
        'can_message', true,
        'can_edit_own_message', true,
        'can_delete_own_message', true,
        'can_delete_any_message', true,
        'can_see_all_chats', true,
        'can_add_participants', true,
        'can_archive_conversation', true,
        'can_export_chat', true,
        'can_view_audit_logs', true
      )
    )
    ON CONFLICT (business_id, role) DO NOTHING;
  END LOOP;
END $$;

-- =============================================================================
-- 3. VERIFY INSERTION
-- =============================================================================
-- Check that business_features were created
SELECT COUNT(*) as business_features_count FROM public.business_features;

-- Check that chat_role_permissions were created
SELECT COUNT(*) as chat_permissions_count FROM public.chat_role_permissions;

-- Display permission summary
SELECT
  business_id,
  role,
  permissions->>'can_initiate_chat' as can_initiate_chat,
  permissions->>'can_see_all_chats' as can_see_all_chats,
  permissions->>'can_delete_any_message' as can_delete_any_message
FROM public.chat_role_permissions
LIMIT 10;

-- =============================================================================
-- 4. DOCUMENTATION: HOW TO ENABLE CHAT FOR A BUSINESS
-- =============================================================================
/*
To enable chat for a specific business, run:

UPDATE public.business_features
SET chat_enabled = TRUE,
    enabled_at = NOW(),
    updated_at = NOW()
WHERE business_id = '{business_uuid}';

To enable chat for all businesses (production rollout):

UPDATE public.business_features
SET chat_enabled = TRUE,
    enabled_at = CASE WHEN enabled_at IS NULL THEN NOW() ELSE enabled_at END,
    updated_at = NOW()
WHERE chat_enabled = FALSE;

To change chat tier for a business:

UPDATE public.business_features
SET chat_tier = 'pro',
    chat_max_messages_per_day = 5000,
    updated_at = NOW()
WHERE business_id = '{business_uuid}';

To disable chat for a business:

UPDATE public.business_features
SET chat_enabled = FALSE,
    disabled_at = NOW(),
    updated_at = NOW()
WHERE business_id = '{business_uuid}';
*/

-- =============================================================================
-- 5. PERFORMANCE TEST DATA (Optional)
-- =============================================================================
-- Uncomment below to create test data for performance testing

/*
-- Create test conversations
INSERT INTO public.conversations (
  business_id,
  context_id,
  context_type,
  participants,
  title,
  message_count
)
SELECT
  b.id,
  gen_random_uuid(),
  'order',
  jsonb_build_array(
    jsonb_build_object(
      'id', u1.id::text,
      'role', 'customer',
      'joined_at', NOW()
    ),
    jsonb_build_object(
      'id', u2.id::text,
      'role', 'merchant',
      'joined_at', NOW()
    )
  ),
  'Test Order Conversation ' || generate_series,
  0
FROM public.businesses b
CROSS JOIN LATERAL (SELECT * FROM public.users WHERE role = 'customer' LIMIT 1) u1
CROSS JOIN LATERAL (SELECT * FROM public.users WHERE role = 'merchant' LIMIT 1) u2
CROSS JOIN generate_series(1, 100)
LIMIT 100;

-- Create test messages
INSERT INTO public.messages (
  conversation_id,
  sender_id,
  content,
  message_type
)
SELECT
  c.id,
  u.id,
  'Test message ' || generate_series,
  'text'
FROM public.conversations c
CROSS JOIN LATERAL (SELECT * FROM public.users WHERE role = 'customer' LIMIT 1) u
CROSS JOIN generate_series(1, 10)
LIMIT 1000;
*/

-- =============================================================================
-- END OF INITIAL DATA SETUP
-- =============================================================================
