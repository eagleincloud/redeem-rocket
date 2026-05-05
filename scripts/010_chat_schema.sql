-- Redeem Rocket: Real-Time Chat System Schema
-- Run this in Supabase SQL Editor
-- Date: May 4, 2026

-- =============================================================================
-- 1. CONVERSATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  context_id UUID, -- References the transaction (order, lead, auction, booking, coupon)
  context_type TEXT NOT NULL CHECK (context_type IN ('order', 'lead', 'auction', 'booking', 'coupon')),

  -- Participants: JSON array of participant objects
  -- [{id: uuid, role: 'customer'|'merchant'|'manager'|'admin', joined_at: timestamp}]
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Conversation state
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  title TEXT, -- Optional descriptive title

  -- Metadata
  last_message_at TIMESTAMPTZ,
  last_message_by UUID,
  message_count INT DEFAULT 0,
  unread_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,

  CONSTRAINT conversation_context_unique UNIQUE (business_id, context_id, context_type),
  CONSTRAINT conversation_business_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversations_business_id ON public.conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_context ON public.conversations(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participants_gin ON public.conversations USING GIN(participants);

-- =============================================================================
-- 2. MESSAGES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,

  -- Message content and type
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),

  -- Delivery state machine
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),

  -- System messages track actions
  system_action TEXT CHECK (system_action IN ('joined_chat', 'left_chat', 'archived', 'reopened')),

  -- Read receipts: JSON array of {user_id, read_at}
  read_by JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Timestamps
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete for GDPR/compliance
  deleted_at TIMESTAMPTZ,

  -- For context in UI (Phase 2)
  reply_to_message_id UUID,

  CONSTRAINT message_conversation_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT message_sender_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT message_reply_fk FOREIGN KEY (reply_to_message_id) REFERENCES public.messages(id) ON DELETE SET NULL,
  CONSTRAINT message_no_empty_content CHECK (
    CASE
      WHEN message_type = 'text' THEN LENGTH(TRIM(content)) > 0
      WHEN message_type = 'system' THEN TRUE
      ELSE TRUE
    END
  )
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status) WHERE status IN ('sent', 'delivered');
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON public.messages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_read_by_gin ON public.messages USING GIN(read_by);
CREATE INDEX IF NOT EXISTS idx_messages_pagination ON public.messages(conversation_id, created_at DESC) WHERE deleted_at IS NULL;

-- =============================================================================
-- 3. MESSAGE ATTACHMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,

  -- File metadata
  file_name TEXT NOT NULL,
  file_size INT NOT NULL, -- In bytes
  file_type TEXT NOT NULL, -- MIME type

  -- Cloud storage reference
  storage_path TEXT NOT NULL UNIQUE, -- s3://bucket/conversations/{conversation_id}/{message_id}/{filename}
  storage_provider TEXT NOT NULL DEFAULT 's3' CHECK (storage_provider IN ('s3', 'gcs', 'azure')),

  -- Metadata
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Optional: thumbnail for images
  thumbnail_path TEXT,

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT message_attachments_message_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE,
  CONSTRAINT message_attachments_uploader_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_uploaded_by ON public.message_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_message_attachments_storage_path ON public.message_attachments(storage_path);

-- =============================================================================
-- 4. CHAT_THREADS TABLE (Phase 2)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  parent_message_id UUID NOT NULL,

  -- Thread metadata
  reply_count INT DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chat_threads_conversation_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT chat_threads_parent_message_fk FOREIGN KEY (parent_message_id) REFERENCES public.messages(id) ON DELETE CASCADE,
  UNIQUE (conversation_id, parent_message_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_conversation_id ON public.chat_threads(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_parent_message_id ON public.chat_threads(parent_message_id);

-- =============================================================================
-- 5. CHAT_SETTINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,

  -- Notification preferences
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notification_type TEXT DEFAULT 'in_app' CHECK (notification_type IN ('in_app', 'push', 'email', 'all')),

  -- Mute conversation
  muted_conversations JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of conversation_ids

  -- Archive conversation
  archived_conversations JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Typing indicator & read receipt preferences
  show_typing_indicator BOOLEAN NOT NULL DEFAULT TRUE,
  show_read_receipts BOOLEAN NOT NULL DEFAULT TRUE,

  -- Sound preferences
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chat_settings_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT chat_settings_business_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
  UNIQUE (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_settings_user_id ON public.chat_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_settings_business_id ON public.chat_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_settings_lookup ON public.chat_settings(user_id, business_id);

-- =============================================================================
-- 6. BUSINESS_FEATURES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.business_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,

  -- Feature flags
  chat_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  chat_max_messages_per_day INT DEFAULT 1000,
  group_chat_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  file_sharing_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Feature metadata
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,

  -- Tier information
  chat_tier TEXT DEFAULT 'basic' CHECK (chat_tier IN ('basic', 'pro', 'enterprise')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT business_features_business_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
  UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS idx_business_features_chat_enabled ON public.business_features(chat_enabled) WHERE chat_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_business_features_business_id ON public.business_features(business_id);

-- =============================================================================
-- 7. CHAT_ROLE_PERMISSIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chat_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,

  -- Role definition
  role TEXT NOT NULL CHECK (role IN ('customer', 'merchant', 'manager', 'admin')),

  -- Permissions JSON object
  permissions JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chat_role_permissions_business_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
  UNIQUE (business_id, role)
);

CREATE INDEX IF NOT EXISTS idx_chat_role_permissions_business_role ON public.chat_role_permissions(business_id, role);

-- =============================================================================
-- 8. CHAT_AUDIT_LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chat_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID,

  -- Action tracking
  action TEXT NOT NULL CHECK (action IN (
    'message_sent', 'message_edited', 'message_deleted',
    'conversation_created', 'conversation_archived',
    'file_uploaded', 'file_deleted'
  )),
  resource_id UUID,
  resource_type TEXT CHECK (resource_type IN ('message', 'conversation', 'attachment')),

  -- Context
  changes JSONB,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chat_audit_log_business_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT chat_audit_log_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_audit_log_business_id ON public.chat_audit_log(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_audit_log_user_id ON public.chat_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_audit_log_action ON public.chat_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_chat_audit_log_created_at ON public.chat_audit_log(created_at DESC);

-- =============================================================================
-- 9. GRANT PERMISSIONS (Adjust user/roles as needed)
-- =============================================================================
-- This is typically handled by Supabase dashboard, but documented here for reference
-- GRANT ALL ON public.conversations TO authenticated;
-- GRANT ALL ON public.messages TO authenticated;
-- GRANT ALL ON public.message_attachments TO authenticated;
-- GRANT ALL ON public.chat_settings TO authenticated;
-- GRANT ALL ON public.business_features TO authenticated;
-- GRANT ALL ON public.chat_role_permissions TO authenticated;
-- GRANT ALL ON public.chat_audit_log TO authenticated;

-- End of schema deployment
