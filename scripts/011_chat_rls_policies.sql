-- Redeem Rocket: Real-Time Chat System - RLS Policies
-- Run this in Supabase SQL Editor
-- Note: Must be run AFTER 010_chat_schema.sql
-- Date: May 4, 2026

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CONVERSATIONS: RLS POLICIES
-- =============================================================================

-- Policy 1: Users can select conversations where they are participants
CREATE POLICY conversations_select ON public.conversations
  FOR SELECT
  USING (
    -- User is in participants array
    EXISTS (
      SELECT 1 FROM jsonb_array_elements(participants) AS participant
      WHERE participant->>'id' = auth.uid()::text
    )
  );

-- Policy 2: Users can insert conversations if they have permission
CREATE POLICY conversations_insert ON public.conversations
  FOR INSERT
  WITH CHECK (
    -- Check if user has "can_initiate_chat" permission
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.chat_role_permissions crp
        WHERE crp.business_id = conversations.business_id
        AND crp.role = u.role
        AND (crp.permissions->>'can_initiate_chat')::boolean = TRUE
      )
    )
  );

-- Policy 3: Users can update conversations where they are participants
CREATE POLICY conversations_update ON public.conversations
  FOR UPDATE
  USING (
    -- User is in participants array OR is a manager/admin
    EXISTS (
      SELECT 1 FROM jsonb_array_elements(participants) AS participant
      WHERE participant->>'id' = auth.uid()::text
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin')
    )
  )
  WITH CHECK (
    -- Cannot update if not in conversation
    EXISTS (
      SELECT 1 FROM jsonb_array_elements(participants) AS participant
      WHERE participant->>'id' = auth.uid()::text
    )
  );

-- =============================================================================
-- MESSAGES: RLS POLICIES
-- =============================================================================

-- Policy 1: Users can select messages from conversations they participate in
CREATE POLICY messages_select ON public.messages
  FOR SELECT
  USING (
    -- Must be in the conversation
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (
        -- User is a participant
        EXISTS (
          SELECT 1 FROM jsonb_array_elements(c.participants) AS participant
          WHERE participant->>'id' = auth.uid()::text
        )
        OR
        -- User is a manager or admin
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('manager', 'admin')
        )
      )
    )
  );

-- Policy 2: Users can insert messages only in conversations they're in
CREATE POLICY messages_insert ON public.messages
  FOR INSERT
  WITH CHECK (
    -- Sender must be current user
    sender_id = auth.uid()
    AND
    -- Must be in the conversation
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(c.participants) AS participant
        WHERE participant->>'id' = auth.uid()::text
      )
    )
  );

-- Policy 3: Users can update their own messages or delete (if manager)
CREATE POLICY messages_update ON public.messages
  FOR UPDATE
  USING (
    -- Owner can edit their own messages
    sender_id = auth.uid()
  )
  WITH CHECK (
    sender_id = auth.uid()
  );

-- Policy 4: Users can delete their own messages or admins can delete any
CREATE POLICY messages_delete ON public.messages
  FOR DELETE
  USING (
    -- Message sender can delete own message
    sender_id = auth.uid()
    OR
    -- Managers/admins can delete any message
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin')
    )
  );

-- =============================================================================
-- MESSAGE_ATTACHMENTS: RLS POLICIES
-- =============================================================================

-- Policy 1: Users can select attachments from messages in their conversations
CREATE POLICY message_attachments_select ON public.message_attachments
  FOR SELECT
  USING (
    -- Must have access to the message's conversation
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
      AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = m.conversation_id
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(c.participants) AS participant
          WHERE participant->>'id' = auth.uid()::text
        )
      )
    )
  );

-- Policy 2: Users can insert attachments to messages they can send to
CREATE POLICY message_attachments_insert ON public.message_attachments
  FOR INSERT
  WITH CHECK (
    -- Uploader must be current user
    uploaded_by = auth.uid()
    AND
    -- Attachment's message must be in a conversation user is in
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
      AND sender_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = m.conversation_id
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(c.participants) AS participant
          WHERE participant->>'id' = auth.uid()::text
        )
      )
    )
  );

-- Policy 3: Users can delete their own attachments or admins can delete any
CREATE POLICY message_attachments_delete ON public.message_attachments
  FOR DELETE
  USING (
    -- Uploader can delete own attachment
    uploaded_by = auth.uid()
    OR
    -- Managers/admins can delete any attachment
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin')
    )
  );

-- =============================================================================
-- CHAT_SETTINGS: RLS POLICIES
-- =============================================================================

-- Policy 1: Users can select their own settings
CREATE POLICY chat_settings_select ON public.chat_settings
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Users can insert their own settings
CREATE POLICY chat_settings_insert ON public.chat_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can update their own settings
CREATE POLICY chat_settings_update ON public.chat_settings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- BUSINESS_FEATURES: RLS POLICIES
-- =============================================================================

-- Policy 1: All authenticated users can select business features
CREATE POLICY business_features_select ON public.business_features
  FOR SELECT
  USING (TRUE);

-- Note: business_features INSERT/UPDATE/DELETE should be restricted to admins
-- This should be enforced at the application level with additional role checks

-- =============================================================================
-- CHAT_ROLE_PERMISSIONS: RLS POLICIES
-- =============================================================================

-- Policy 1: All authenticated users can select role permissions
CREATE POLICY chat_role_permissions_select ON public.chat_role_permissions
  FOR SELECT
  USING (TRUE);

-- Note: role permissions should only be modified by admins
-- This should be enforced at the application level

-- =============================================================================
-- CHAT_AUDIT_LOG: RLS POLICIES
-- =============================================================================

-- Policy 1: Only admins can view audit logs
CREATE POLICY chat_audit_log_select ON public.chat_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Policy 2: System can insert audit logs (service role)
-- This is handled by application with service role key

-- =============================================================================
-- HELPER FUNCTION: Check if user is conversation participant
-- =============================================================================
CREATE OR REPLACE FUNCTION is_conversation_participant(
  conversation_id UUID,
  user_id UUID
)
RETURNS BOOLEAN AS $$
SELECT EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(c.participants) AS participant
    WHERE participant->>'id' = user_id::text
  )
);
$$ LANGUAGE SQL SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Check if user has chat permission
-- =============================================================================
CREATE OR REPLACE FUNCTION has_chat_permission(
  business_id UUID,
  user_id UUID,
  permission_key TEXT
)
RETURNS BOOLEAN AS $$
SELECT COALESCE((
  SELECT (permissions->>permission_key)::BOOLEAN
  FROM public.chat_role_permissions crp
  INNER JOIN public.users u ON u.role = crp.role
  WHERE crp.business_id = business_id
  AND u.id = user_id
), FALSE);
$$ LANGUAGE SQL SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Get user's role in a business
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_role_in_business(
  business_id UUID,
  user_id UUID
)
RETURNS TEXT AS $$
SELECT u.role
FROM public.users u
WHERE u.id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- =============================================================================
-- END OF RLS POLICIES DEPLOYMENT
-- =============================================================================
