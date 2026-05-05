# Real-Time Chat System Specification
## Redeem Rocket - Multi-Tenant SaaS Platform

**Document Version:** 1.0  
**Date:** May 4, 2026  
**Status:** Ready for Engineering Implementation  
**Target Timeline:** Phase 1 MVP (3 weeks) + Phase 2 (2 weeks)

---

## EXECUTIVE SUMMARY

This specification defines a transaction-driven contextual chat system for the Redeem Rocket multi-tenant SaaS platform. Unlike generic messaging apps, this chat system is tightly integrated with business transactions (Orders, Leads, Auctions, Bookings, Coupons) to enable targeted conversations about specific deals and operations.

**Key Features:**
- Real-time WebSocket-driven messaging with fallback polling
- Multi-tenant isolation with Row-Level Security (RLS)
- Feature flag system for per-business chat enablement
- Role-based access control (Customer, Merchant, Manager, Admin)
- Transaction-contextual conversations
- Comprehensive audit trails and compliance

---

## 1. DATABASE SCHEMA

### 1.1 Core Tables

#### conversations
Stores conversation metadata and context linking.

```sql
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  context_id UUID, -- References the transaction (order, lead, auction, booking, coupon)
  context_type TEXT NOT NULL CHECK (context_type IN ('order', 'lead', 'auction', 'booking', 'coupon')),
  
  -- Participants: JSON array of participant objects
  -- [{id: uuid, role: 'customer'|'merchant'|'manager'|'admin', joined_at: timestamp}]
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Conversation state
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  title TEXT, -- Optional descriptive title (auto-generated: "Order #123 - Shipping Status")
  
  -- Metadata
  last_message_at TIMESTAMPTZ,
  last_message_by UUID, -- User ID who sent the last message
  message_count INT DEFAULT 0,
  unread_count INT DEFAULT 0, -- Denormalized for performance
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  
  -- RLS: Conversation belongs to a business
  CONSTRAINT conversation_context_unique UNIQUE (business_id, context_id, context_type)
);

CREATE INDEX idx_conversations_business_id ON public.conversations(business_id);
CREATE INDEX idx_conversations_context ON public.conversations(context_type, context_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_status ON public.conversations(status) WHERE status = 'active';
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);

-- GiST index for JSONB participant search
CREATE INDEX idx_conversations_participants_gin ON public.conversations USING GIN(participants);
```

#### messages
Individual chat messages with delivery and read status tracking.

```sql
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Message content and type
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  
  -- Delivery state machine
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  
  -- System messages track actions: "joined_chat", "left_chat", "archived", etc.
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
  
  -- For context in UI
  reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  
  CONSTRAINT message_no_empty_content CHECK (
    CASE 
      WHEN message_type = 'text' THEN LENGTH(TRIM(content)) > 0
      WHEN message_type = 'system' THEN TRUE
      ELSE TRUE
    END
  )
);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_status ON public.messages(status) WHERE status IN ('sent', 'delivered');
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_deleted_at ON public.messages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_read_by_gin ON public.messages USING GIN(read_by);
```

#### message_attachments
File/image storage metadata (actual files stored in S3/Cloud Storage).

```sql
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  
  -- File metadata
  file_name TEXT NOT NULL,
  file_size INT NOT NULL, -- In bytes, max enforced at application layer
  file_type TEXT NOT NULL, -- MIME type: image/jpeg, application/pdf, etc.
  
  -- Cloud storage reference
  storage_path TEXT NOT NULL UNIQUE, -- s3://bucket/conversations/{conversation_id}/{message_id}/{filename}
  storage_provider TEXT NOT NULL DEFAULT 's3' CHECK (storage_provider IN ('s3', 'gcs', 'azure')),
  
  -- Metadata
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Optional: thumbnail for images
  thumbnail_path TEXT,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_attachments_message_id ON public.message_attachments(message_id);
CREATE INDEX idx_message_attachments_uploaded_by ON public.message_attachments(uploaded_by);
CREATE INDEX idx_message_attachments_storage_path ON public.message_attachments(storage_path);
```

#### chat_threads (Phase 2)
Nested replies structure for threaded conversations.

```sql
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  parent_message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  
  -- Thread metadata
  reply_count INT DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb, -- Users who replied in thread
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_threads_conversation_id ON public.chat_threads(conversation_id);
CREATE INDEX idx_chat_threads_parent_message_id ON public.chat_threads(parent_message_id);
```

#### chat_settings
Per-user chat preferences and notification settings.

```sql
CREATE TABLE IF NOT EXISTS public.chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Notification preferences
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notification_type TEXT DEFAULT 'in_app' CHECK (notification_type IN ('in_app', 'push', 'email', 'all')),
  
  -- Mute conversation (user still receives messages but no notifications)
  muted_conversations JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of conversation_ids
  
  -- Archive conversation (hidden from main list, searchable)
  archived_conversations JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Typing indicator & read receipt preferences
  show_typing_indicator BOOLEAN NOT NULL DEFAULT TRUE,
  show_read_receipts BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Sound preferences
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, business_id)
);

CREATE INDEX idx_chat_settings_user_id ON public.chat_settings(user_id);
CREATE INDEX idx_chat_settings_business_id ON public.chat_settings(business_id);
```

#### business_features
Feature flag system for per-business feature enablement.

```sql
CREATE TABLE IF NOT EXISTS public.business_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Feature flags
  chat_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  chat_max_messages_per_day INT DEFAULT 1000, -- Rate limit
  group_chat_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  file_sharing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Feature metadata
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  
  -- Tier information
  chat_tier TEXT DEFAULT 'basic' CHECK (chat_tier IN ('basic', 'pro', 'enterprise')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (business_id)
);

CREATE INDEX idx_business_features_chat_enabled ON public.business_features(chat_enabled) WHERE chat_enabled = TRUE;
```

#### chat_audit_log
Audit trail for compliance and security.

```sql
CREATE TABLE IF NOT EXISTS public.chat_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Action tracking
  action TEXT NOT NULL CHECK (action IN ('message_sent', 'message_edited', 'message_deleted', 'conversation_created', 'conversation_archived', 'file_uploaded', 'file_deleted')),
  resource_id UUID, -- The message_id or conversation_id
  resource_type TEXT CHECK (resource_type IN ('message', 'conversation', 'attachment')),
  
  -- Context
  changes JSONB, -- Before/after diff for edits/deletes
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_audit_log_business_id ON public.chat_audit_log(business_id, created_at DESC);
CREATE INDEX idx_chat_audit_log_user_id ON public.chat_audit_log(user_id, created_at DESC);
CREATE INDEX idx_chat_audit_log_action ON public.chat_audit_log(action);
CREATE INDEX idx_chat_audit_log_created_at ON public.chat_audit_log(created_at DESC);
```

#### chat_role_permissions
Role-based access control matrix.

```sql
CREATE TABLE IF NOT EXISTS public.chat_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Role definition
  role TEXT NOT NULL CHECK (role IN ('customer', 'merchant', 'manager', 'admin')),
  
  -- Permissions: JSON object
  -- {
  --   "can_initiate_chat": true,
  --   "can_message": true,
  --   "can_see_all_chats": false,
  --   "can_archive_chat": true,
  --   "can_delete_message": false,
  --   "can_add_participants": false
  -- }
  permissions JSONB NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (business_id, role)
);

CREATE INDEX idx_chat_role_permissions_business_role ON public.chat_role_permissions(business_id, role);
```

### 1.2 Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all chat tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_features ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can only see conversations where they are participants
CREATE POLICY conversations_select ON public.conversations
  FOR SELECT
  USING (
    -- Check if current_user_id is in participants array
    EXISTS (
      SELECT 1 FROM jsonb_array_elements(participants) AS participant
      WHERE participant->>'id' = auth.uid()::text
    )
    OR
    -- Business admins can see all conversations for their business
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND u.id IN (
        SELECT DISTINCT (jsonb_array_elements(participants)->>'id')::uuid
        FROM public.conversations c
        WHERE c.business_id = conversations.business_id
      )
    )
  );

-- Messages: Users can see messages in conversations they're part of
CREATE POLICY messages_select ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(c.participants) AS participant
        WHERE participant->>'id' = auth.uid()::text
      )
    )
  );

-- Messages: Users can only insert messages into conversations they're in
CREATE POLICY messages_insert ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(c.participants) AS participant
        WHERE participant->>'id' = auth.uid()::text
      )
    )
  );

-- Messages: Users can only update their own messages
CREATE POLICY messages_update ON public.messages
  FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Attachments: Users can only see attachments in conversations they're part of
CREATE POLICY message_attachments_select ON public.message_attachments
  FOR SELECT
  USING (
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
```

### 1.3 Indexing Strategy

```sql
-- Composite indexes for common queries
CREATE INDEX idx_conversations_user_business 
  ON public.conversations(business_id) 
  WHERE status = 'active'
  AND participants @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text));

-- Partial index for unread messages (common query)
CREATE INDEX idx_messages_unread 
  ON public.messages(conversation_id, created_at DESC)
  WHERE status IN ('sent', 'delivered');

-- Index for chat settings lookups
CREATE INDEX idx_chat_settings_lookup 
  ON public.chat_settings(user_id, business_id);

-- Index for pagination queries
CREATE INDEX idx_messages_pagination 
  ON public.messages(conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

---

## 2. DATA MODEL & RELATIONSHIPS

### 2.1 Entity Definitions

#### Conversation Entity
```typescript
interface Conversation {
  id: string;
  businessId: string;
  contextId?: string; // UUID of order, lead, etc.
  contextType: 'order' | 'lead' | 'auction' | 'booking' | 'coupon';
  participants: {
    id: string; // user_id
    role: UserRole;
    joinedAt: Date;
    lastSeenAt?: Date;
  }[];
  status: 'active' | 'archived' | 'closed';
  title?: string; // Auto-generated: "Order #123 - Shipping Status"
  lastMessageAt?: Date;
  lastMessageBy?: string;
  messageCount: number;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}
```

#### Message Entity
```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  systemAction?: 'joined_chat' | 'left_chat' | 'archived' | 'reopened';
  readBy: {
    userId: string;
    readAt: Date;
  }[];
  attachments?: MessageAttachment[];
  replyToMessageId?: string; // Phase 2
  sentAt: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete
}
```

#### MessageAttachment Entity
```typescript
interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number; // bytes
  fileType: string; // MIME type
  storagePath: string; // s3://bucket/...
  storageProvider: 's3' | 'gcs' | 'azure';
  uploadedBy: string;
  uploadedAt: Date;
  thumbnailPath?: string;
  deletedAt?: Date;
}
```

#### ChatSettings Entity
```typescript
interface ChatSettings {
  userId: string;
  businessId: string;
  notificationsEnabled: boolean;
  notificationType: 'in_app' | 'push' | 'email' | 'all';
  mutedConversations: string[]; // conversation_ids
  archivedConversations: string[];
  showTypingIndicator: boolean;
  showReadReceipts: boolean;
  soundEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Relationships

```
businesses (1) ──────────────── (many) conversations
                                     │
                                     ├─ (many) messages
                                     │           ├─ (many) message_attachments
                                     │           └─ (many) chat_threads (Phase 2)
                                     │
                                     ├─ (many) chat_settings
                                     │
                                     └─ (1) business_features

orders/leads/auctions/bookings/coupons (1) ──── (1) conversations (via context_id)

users (many) ────────────────── (many) conversations (through participants)
users (1) ──────────────────── (many) messages
users (1) ──────────────────── (many) chat_settings
```

### 2.3 Query Optimization Patterns

**Common Query 1: Get active conversations for user**
```sql
SELECT c.*
FROM conversations c
WHERE c.business_id = $1
  AND c.status = 'active'
  AND c.participants @> jsonb_build_array(jsonb_build_object('id', $2::text))
ORDER BY c.last_message_at DESC NULLS LAST
LIMIT 50;
```
**Index:** `idx_conversations_user_business`

**Common Query 2: Get paginated messages for conversation**
```sql
SELECT m.*
FROM messages m
WHERE m.conversation_id = $1
  AND m.deleted_at IS NULL
ORDER BY m.created_at DESC
LIMIT 50 OFFSET $2;
```
**Index:** `idx_messages_pagination`

**Common Query 3: Get unread message count**
```sql
SELECT COUNT(*) as unread_count
FROM messages m
WHERE m.conversation_id = $1
  AND m.status IN ('sent', 'delivered')
  AND NOT m.read_by @> jsonb_build_array(jsonb_build_object('userId', $2::text));
```
**Index:** `idx_messages_unread`

---

## 3. REAL-TIME IMPLEMENTATION

### 3.1 Technology Choice: Supabase Realtime (Primary)

**Why Supabase Realtime?**
- Tight integration with PostgreSQL database and RLS policies
- Multi-tenant support built-in via RLS
- Scales to thousands of concurrent connections
- Native TypeScript support
- Cost-effective compared to Firebase

**Architecture:**
```
┌─────────────────┐
│   Web/Mobile    │
│   Clients       │
└────────┬────────┘
         │
         ├──────────── WebSocket (Realtime)
         │
         ▼
┌────────────────────────┐
│  Supabase Realtime     │
│  (postgres_changes)    │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│   PostgreSQL           │
│   (with RLS)           │
└────────────────────────┘
```

### 3.2 WebSocket Events

**Publish events via Supabase client:**

```typescript
// Initialize Realtime channel
const channel = supabase
  .channel(`conversation:${conversationId}`, {
    config: {
      broadcast: { self: true },
      presence: { key: userId }
    }
  })
  .on('broadcast', { event: 'message.sent' }, (payload) => {
    // Handle new message
  })
  .on('presence', { event: 'sync' }, () => {
    // Update typing indicators, presence
  })
  .subscribe();

// Subscribe to database changes (automatic via RLS)
const subscription = supabase
  .channel(`realtime:messages:conversation_id=eq.${conversationId}`)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'messages' },
    (payload) => {
      // Automatic filtering via RLS
      console.log('Message change:', payload);
    }
  )
  .subscribe();
```

**WebSocket Events:**
- `message.sent` — New message in conversation (broadcast)
- `message.delivered` — Message delivery confirmation (broadcast)
- `message.read` — Message read receipts (broadcast)
- `typing.started` — User started typing (presence)
- `typing.stopped` — User stopped typing (presence)
- `user.joined_chat` — User joined conversation (postgres_changes)
- `user.left_chat` — User left conversation (postgres_changes)
- `message.edited` (Phase 2) — Message edit notification
- `message.deleted` (Phase 2) — Message deletion notification

### 3.3 Fallback Strategy: Polling for Mobile

For devices with unreliable connections, implement exponential backoff polling:

```typescript
const POLL_INTERVALS = [2000, 4000, 8000, 16000, 30000]; // 2s → 30s max

async function pollMessages(conversationId: string, lastMessageId?: string) {
  let pollInterval = 0;
  
  while (true) {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .gt('created_at', lastMessageId ? getMessageTime(lastMessageId) : 'now() - 5 minutes')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data && data.length > 0) {
        // Reset interval on success
        pollInterval = 0;
        handleNewMessages(data);
      }
      
      // Exponential backoff
      const delay = POLL_INTERVALS[Math.min(pollInterval, POLL_INTERVALS.length - 1)];
      await new Promise(resolve => setTimeout(resolve, delay));
      pollInterval++;
    } catch (error) {
      console.error('Polling error:', error);
    }
  }
}
```

### 3.4 Connection Management for Scale

**Connection pooling:**
```typescript
// Reuse Supabase client (singleton)
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 100 // Rate limit
      }
    }
  }
);

// Channel subscription pooling
const channelCache = new Map<string, RealtimeChannel>();

export function getOrCreateChannel(conversationId: string) {
  if (channelCache.has(conversationId)) {
    return channelCache.get(conversationId)!;
  }
  
  const channel = supabase.channel(`conversation:${conversationId}`);
  channelCache.set(conversationId, channel);
  
  return channel;
}

// Cleanup on unmount
export function unsubscribeChannel(conversationId: string) {
  const channel = channelCache.get(conversationId);
  if (channel?.state === 'SUBSCRIBED') {
    supabase.removeChannel(channel);
    channelCache.delete(conversationId);
  }
}
```

**Presence tracking for typing indicators:**
```typescript
const channel = supabase.channel(`conversation:${conversationId}`, {
  config: {
    presence: {
      key: userId
    }
  }
});

// Join presence
channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({
      user_id: userId,
      online_at: new Date().toISOString(),
      typing: false,
      typing_at: null
    });
  }
});

// Update presence (typing started)
await channel.track({
  ...currentPresence,
  typing: true,
  typing_at: new Date().toISOString()
});

// Listen to presence updates
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  updateTypingIndicators(state);
});
```

---

## 4. API DESIGN

### 4.1 REST Endpoints

All endpoints require authentication via JWT token in `Authorization: Bearer {token}` header.

#### Create Conversation
```http
POST /api/v1/conversations
Content-Type: application/json

{
  "businessId": "uuid",
  "contextType": "order",
  "contextId": "uuid",
  "participantIds": ["uuid1", "uuid2"], // Optional, system auto-adds users
  "title": "Order #123 - Delivery Status" // Optional
}

Response: 201 Created
{
  "id": "uuid",
  "businessId": "uuid",
  "contextType": "order",
  "contextId": "uuid",
  "participants": [...],
  "status": "active",
  "createdAt": "2026-05-04T10:30:00Z"
}
```

**Permission check:**
- User must have `can_initiate_chat` permission for their role
- User role must be able to chat with participants (via `chat_role_permissions`)

#### Send Message
```http
POST /api/v1/conversations/:conversationId/messages
Content-Type: application/json

{
  "content": "When will my order arrive?",
  "messageType": "text",
  "replyToMessageId": "uuid" // Optional (Phase 2)
}

Response: 201 Created
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "content": "When will my order arrive?",
  "messageType": "text",
  "status": "sent",
  "sentAt": "2026-05-04T10:31:00Z",
  "createdAt": "2026-05-04T10:31:00Z"
}
```

**Business logic:**
- Check `business_features.chat_enabled` before allowing
- Enforce `chat_max_messages_per_day` rate limit (from `business_features`)
- Mark sender as participant with `joined_at = now()` if not already in conversation
- Broadcast via WebSocket immediately
- Update conversation's `last_message_at`, `last_message_by`, `message_count`

#### Upload File/Image
```http
POST /api/v1/conversations/:conversationId/attachments
Content-Type: multipart/form-data

file: <binary>

Response: 201 Created
{
  "id": "uuid",
  "messageId": "uuid",
  "fileName": "receipt.jpg",
  "fileSize": 256000,
  "fileType": "image/jpeg",
  "storagePath": "s3://redeem-rocket/conversations/conv-uuid/msg-uuid/receipt.jpg",
  "uploadedAt": "2026-05-04T10:32:00Z"
}
```

**Validations:**
- Max file size: 10MB (configurable per tier)
- Allowed types: jpg, png, pdf, doc, docx
- Scan for malware before storing (VirusTotal/ClamAV)

#### Get Messages (Paginated)
```http
GET /api/v1/conversations/:conversationId/messages?limit=50&offset=0&sortBy=desc
Authorization: Bearer {token}

Response: 200 OK
{
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "uuid",
      "senderName": "John Doe",
      "senderRole": "customer",
      "senderAvatar": "https://...",
      "content": "When will my order arrive?",
      "messageType": "text",
      "status": "read",
      "readBy": [
        { "userId": "uuid", "readAt": "2026-05-04T10:31:30Z" }
      ],
      "attachments": [],
      "sentAt": "2026-05-04T10:31:00Z",
      "createdAt": "2026-05-04T10:31:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

**Database optimization:**
- Use cursor-based pagination (keyset pagination) for better performance on large result sets
- Return only necessary fields (sender name/role via LEFT JOIN with users)

#### Mark Messages as Read
```http
PUT /api/v1/conversations/:conversationId/read
Content-Type: application/json
Authorization: Bearer {token}

{
  "messageIds": ["uuid1", "uuid2"], // Or empty to mark all as read
  "readAt": "2026-05-04T10:32:00Z" // ISO timestamp
}

Response: 200 OK
{
  "conversationId": "uuid",
  "readCount": 2,
  "readAt": "2026-05-04T10:32:00Z"
}
```

**Implementation:**
- Update `messages.read_by` JSONB array
- Update `messages.status` to 'read'
- Broadcast read receipt via WebSocket
- Decrement conversation's `unread_count` (denormalized)

#### Delete Message
```http
DELETE /api/v1/messages/:messageId
Authorization: Bearer {token}

Response: 204 No Content
```

**Business logic:**
- Only message sender or admins can delete
- Soft delete: set `deleted_at = now()`
- Update `messages.content` to empty string if after 5 minutes
- Send system message: "Message deleted by user"
- Log to `chat_audit_log`

#### Archive Conversation
```http
PUT /api/v1/conversations/:conversationId/archive
Authorization: Bearer {token}

{
  "archived": true // or false to unarchive
}

Response: 200 OK
{
  "id": "uuid",
  "status": "archived",
  "archivedAt": "2026-05-04T10:33:00Z"
}
```

#### List Conversations
```http
GET /api/v1/conversations?businessId=uuid&status=active&limit=20&offset=0
Authorization: Bearer {token}

Response: 200 OK
{
  "conversations": [
    {
      "id": "uuid",
      "businessId": "uuid",
      "contextType": "order",
      "contextId": "uuid",
      "title": "Order #123 - Shipping Status",
      "participants": [...],
      "status": "active",
      "lastMessageAt": "2026-05-04T10:31:00Z",
      "lastMessageBy": "uuid",
      "messageCount": 15,
      "unreadCount": 3,
      "createdAt": "2026-05-04T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 4.2 Error Responses

All errors follow RFC 7807 (Problem Details):

```json
{
  "type": "https://api.redeemrocket.com/errors/chat-disabled",
  "title": "Chat Not Available",
  "status": 403,
  "detail": "Chat feature is not enabled for this business",
  "instance": "/api/v1/conversations",
  "timestamp": "2026-05-04T10:35:00Z"
}
```

**Common error codes:**
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing/invalid token
- `403 Forbidden` — Feature disabled, permission denied, rate limit exceeded
- `404 Not Found` — Conversation/message not found
- `409 Conflict` — Conversation already exists for context_id + context_type
- `429 Too Many Requests` — Rate limit exceeded
- `500 Internal Server Error` — Server error

### 4.3 Rate Limiting

Per-user rate limits enforced at API gateway (nginx/Cloudflare):

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /messages | 100 | 1 minute |
| GET /messages | 500 | 1 minute |
| POST /conversations | 50 | 1 hour |
| POST /attachments | 50 | 1 hour |

Limits are configurable per business via `business_features.chat_tier`.

---

## 5. FEATURE FLAG IMPLEMENTATION

### 5.1 Feature Flag Middleware

```typescript
// Middleware: Check if chat is enabled before processing requests
export async function chatFeatureFlagMiddleware(req: Request, res: Response, next: NextFunction) {
  const { businessId } = req.params;
  
  // Check cache first (Redis with 5min TTL)
  const cacheKey = `chat-feature:${businessId}`;
  let featureFlag = await redis.get(cacheKey);
  
  if (!featureFlag) {
    const { data } = await supabase
      .from('business_features')
      .select('chat_enabled, chat_tier, chat_max_messages_per_day')
      .eq('business_id', businessId)
      .single();
    
    featureFlag = data;
    await redis.setex(cacheKey, 300, JSON.stringify(featureFlag)); // Cache 5 min
  }
  
  if (!featureFlag?.chat_enabled) {
    return res.status(403).json({
      type: 'https://api.redeemrocket.com/errors/chat-disabled',
      title: 'Chat Not Available',
      status: 403,
      detail: 'Chat feature is not enabled for this business'
    });
  }
  
  req.featureFlag = featureFlag;
  next();
}

// Usage in routes
router.post('/api/v1/conversations', 
  authMiddleware,
  chatFeatureFlagMiddleware,
  createConversationHandler
);
```

### 5.2 Database-Driven Feature Flags

Admins can enable/disable chat via admin panel:

```typescript
// Admin endpoint to toggle chat
router.patch('/api/v1/admin/businesses/:businessId/features/chat', adminOnly, async (req, res) => {
  const { businessId } = req.params;
  const { enabled, tier, maxMessagesPerDay } = req.body;
  
  const { data } = await supabase
    .from('business_features')
    .upsert({
      business_id: businessId,
      chat_enabled: enabled,
      chat_tier: tier || 'basic',
      chat_max_messages_per_day: maxMessagesPerDay || 1000,
      enabled_at: enabled ? new Date() : null,
      disabled_at: !enabled ? new Date() : null
    })
    .eq('business_id', businessId)
    .select();
  
  // Invalidate cache
  await redis.del(`chat-feature:${businessId}`);
  
  res.json(data[0]);
});
```

### 5.3 UI Component Behavior

```typescript
// React component: Show "Chat" button only if enabled
function ConversationButton({ businessId, contextType, contextId }) {
  const [chatEnabled, setChatEnabled] = useState(false);
  
  useEffect(() => {
    // Check feature flag at render time
    supabase
      .from('business_features')
      .select('chat_enabled')
      .eq('business_id', businessId)
      .single()
      .then(({ data }) => setChatEnabled(data?.chat_enabled || false));
  }, [businessId]);
  
  if (!chatEnabled) {
    return <span className="text-gray-400">Chat unavailable</span>;
  }
  
  return (
    <button onClick={() => openChat(businessId, contextType, contextId)}>
      Open Chat
    </button>
  );
}
```

---

## 6. ROLE-BASED ACCESS CONTROL

### 6.1 Permission Matrix

| Action | Customer | Merchant | Manager | Admin |
|--------|----------|----------|---------|-------|
| Initiate chat | Yes | Yes | Yes | Yes |
| Send message | Yes | Yes | Yes | Yes |
| Edit own messages | Yes | Yes | Yes | Yes |
| Delete own messages | Yes | Yes | Yes | Yes |
| Delete any message | No | No | Yes | Yes |
| Archive conversation | Yes | Yes | Yes | Yes |
| See all business chats | No | No | Yes | Yes |
| Add participants | No | No | Yes | Yes |
| Export chat history | No | No | Yes | Yes |
| View audit logs | No | No | No | Yes |

### 6.2 Database Implementation

```sql
-- Insert default permissions for each role
INSERT INTO public.chat_role_permissions (business_id, role, permissions)
VALUES
  ('${businessId}', 'customer', '{
    "can_initiate_chat": true,
    "can_message": true,
    "can_edit_own_message": true,
    "can_delete_own_message": true,
    "can_see_all_chats": false,
    "can_add_participants": false,
    "can_archive_conversation": true,
    "can_export_chat": false,
    "can_view_audit_logs": false
  }'::jsonb),
  ('${businessId}', 'merchant', '{
    "can_initiate_chat": true,
    "can_message": true,
    "can_edit_own_message": true,
    "can_delete_own_message": true,
    "can_see_all_chats": false,
    "can_add_participants": false,
    "can_archive_conversation": true,
    "can_export_chat": false,
    "can_view_audit_logs": false
  }'::jsonb),
  ('${businessId}', 'manager', '{
    "can_initiate_chat": true,
    "can_message": true,
    "can_edit_own_message": true,
    "can_delete_own_message": true,
    "can_delete_any_message": true,
    "can_see_all_chats": true,
    "can_add_participants": true,
    "can_archive_conversation": true,
    "can_export_chat": true,
    "can_view_audit_logs": false
  }'::jsonb),
  ('${businessId}', 'admin', '{
    "can_initiate_chat": true,
    "can_message": true,
    "can_edit_own_message": true,
    "can_delete_own_message": true,
    "can_delete_any_message": true,
    "can_see_all_chats": true,
    "can_add_participants": true,
    "can_archive_conversation": true,
    "can_export_chat": true,
    "can_view_audit_logs": true
  }'::jsonb);
```

### 6.3 Permission Check Middleware

```typescript
export async function checkChatPermission(
  permission: string,
  userId: string,
  businessId: string
) {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  const { data: perms } = await supabase
    .from('chat_role_permissions')
    .select('permissions')
    .eq('business_id', businessId)
    .eq('role', user.role)
    .single();
  
  const hasPermission = perms?.permissions?.[permission] || false;
  return hasPermission;
}

// Usage in handler
async function deleteMessageHandler(req: Request, res: Response) {
  const { messageId } = req.params;
  const userId = req.user.id;
  
  const { data: message } = await supabase
    .from('messages')
    .select('sender_id, conversations(business_id)')
    .eq('id', messageId)
    .single();
  
  // Only allow deletion if:
  // 1. User is message sender AND has "can_delete_own_message"
  // 2. OR user has "can_delete_any_message"
  const isOwner = message.sender_id === userId;
  const canDeleteOwn = await checkChatPermission('can_delete_own_message', userId, message.conversations.business_id);
  const canDeleteAny = await checkChatPermission('can_delete_any_message', userId, message.conversations.business_id);
  
  if (!(isOwner && canDeleteOwn) && !canDeleteAny) {
    return res.status(403).json({ error: 'Permission denied' });
  }
  
  // Proceed with deletion
}
```

---

## 7. NOTIFICATIONS

### 7.1 Notification Triggers

**In-app notifications** (real-time via WebSocket):
- New message in conversation where user is participant
- Message read receipts
- User joined/left conversation

**Push notifications** (Firebase Cloud Messaging / APNS):
- New message (if user has enabled push notifications)
- High-priority mention or reply
- Rate-limited: max 1 per minute per user per conversation

**Email notifications** (Resend API):
- Daily digest of unread messages (opt-in)
- Rate-limited: max 1 email per day per user per business

### 7.2 Notification Payload

```typescript
interface ChatNotification {
  type: 'message' | 'read_receipt' | 'user_joined' | 'user_left';
  conversationId: string;
  contextType: 'order' | 'lead' | 'auction' | 'booking' | 'coupon';
  contextId?: string;
  message?: {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    truncatedContent?: string; // For push: max 240 chars
    sentAt: Date;
  };
  title: string; // e.g., "Order #123 - New message from John"
  body: string;
  icon?: string;
  action?: string; // URL to navigate to
  priority?: 'high' | 'normal';
}
```

### 7.3 Notification Delivery Logic

```typescript
async function sendChatNotifications(message: Message) {
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', message.conversation_id)
    .single();
  
  const recipients = conversation.participants
    .filter(p => p.id !== message.sender_id) // Don't notify sender
    .map(p => p.id);
  
  for (const recipientId of recipients) {
    const { data: settings } = await supabase
      .from('chat_settings')
      .select('*')
      .eq('user_id', recipientId)
      .eq('business_id', conversation.business_id)
      .single();
    
    if (!settings?.notifications_enabled) continue;
    
    // Check if conversation is muted
    if (settings.muted_conversations.includes(message.conversation_id)) continue;
    
    // Fetch user for notification delivery
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', recipientId)
      .single();
    
    const payload = buildNotificationPayload(message, conversation, user);
    
    // Route by notification type
    switch (settings.notification_type) {
      case 'push':
        await sendPushNotification(user, payload);
        break;
      case 'email':
        await sendEmailNotification(user, payload);
        break;
      case 'all':
        // Send both (with rate limiting)
        if (shouldSendPush(recipientId, conversation.id)) {
          await sendPushNotification(user, payload);
        }
        break;
    }
  }
}
```

### 7.4 Badge Display Strategy

**In-app unread badge:**
```typescript
// Update conversation unread count
await supabase
  .from('conversations')
  .update({
    unread_count: unreadCount + 1
  })
  .eq('id', conversationId)
  .eq(
    'participants',
    jsonb_set(
      participants,
      [index(participants, recipientId)],
      jsonb_set(participant, 'last_seen_at', 'now()'::timestamptz)
    )
  );

// Display badge in conversation list
function ConversationListItem({ conversation }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <h3>{conversation.title}</h3>
        <p>{conversation.lastMessage?.content}</p>
      </div>
      {conversation.unreadCount > 0 && (
        <span className="badge badge-primary">{conversation.unreadCount}</span>
      )}
    </div>
  );
}
```

---

## 8. CONTEXT-DRIVEN EXAMPLES

### Example 1: Order Chat

**Scenario:** Customer asks about shipping status for Order #123

```
Timeline:
1. Customer places Order #123
2. System auto-creates conversation: "Order #123 - Shipping Status"
3. Merchant and customer auto-added as participants
4. Customer: "When will my order arrive?"
5. Merchant: "Your order will arrive tomorrow by 5 PM"
6. System notification sent to both parties
```

**Database records:**
```sql
-- Conversation created automatically on order creation
INSERT INTO conversations (
  business_id, context_id, context_type, participants, title
) VALUES (
  'business-uuid',
  'order-uuid',
  'order',
  '[
    {"id": "customer-uuid", "role": "customer", "joined_at": "2026-05-04T10:00:00Z"},
    {"id": "merchant-uuid", "role": "merchant", "joined_at": "2026-05-04T10:00:00Z"}
  ]'::jsonb,
  'Order #123 - Shipping Status'
);

-- Customer sends message
INSERT INTO messages (
  conversation_id, sender_id, content, message_type
) VALUES (
  'conversation-uuid',
  'customer-uuid',
  'When will my order arrive?',
  'text'
);
```

### Example 2: Auction Live Chat

**Scenario:** Multiple bidders discussing Auction #789 in real-time

```
1. Auction #789 starts
2. System auto-creates conversation: "Auction #789 - Live Bidding"
3. Bidders auto-added as participants when they place a bid
4. Bidder A: "Great item! Bidding now"
5. Bidder B: "Nice item, good luck"
6. System message: "New bid placed by Bidder A - $500"
7. Typing indicators: Bidder B is typing...
```

**Conversation record:**
```typescript
{
  businessId: 'auction-business-uuid',
  contextType: 'auction',
  contextId: 'auction-uuid',
  participants: [
    { id: 'bidder-a-uuid', role: 'customer', joinedAt: '2026-05-04T10:05:00Z' },
    { id: 'bidder-b-uuid', role: 'customer', joinedAt: '2026-05-04T10:06:00Z' },
    { id: 'merchant-uuid', role: 'merchant', joinedAt: '2026-05-04T10:00:00Z' }
  ],
  title: 'Auction #789 - Live Bidding',
  createdAt: '2026-05-04T10:00:00Z'
}
```

### Example 3: Coupon Validity Question

**Scenario:** Customer asks merchant if coupon is still valid

```
1. Customer views Coupon #456
2. Clicks "Ask Merchant"
3. System creates conversation: "Coupon #456 - Is it still valid?"
4. Customer: "Is this coupon still valid for my area?"
5. Merchant: "Yes, valid until end of month for all areas"
```

**Conversation purpose:** Reduce support tickets by enabling direct merchant-customer communication within transactional context.

---

## 9. PHASE 1 MVP SPECIFICATION (3 weeks)

### 9.1 Scope

**In:**
- One-to-one and 1-merchant conversations
- Text messages only (images Phase 2)
- Read receipts (binary: read/unread)
- Basic notifications (in-app + push)
- Conversation archiving
- Feature flag enablement per business
- Role-based permissions

**Out (Phase 2+):**
- Group chats
- Threaded replies
- @mentions
- Typing indicators
- Voice notes
- Message search

### 9.2 Implementation Timeline

**Week 1: Database & API**
- Set up PostgreSQL schema (tables, indexes, RLS)
- Build REST API endpoints (CRUD)
- Implement feature flag middleware
- Set up error handling & rate limiting
- Write API tests

**Week 2: Real-time & Notifications**
- Integrate Supabase Realtime (WebSocket)
- Implement push notifications (Firebase Cloud Messaging)
- Add in-app notification UI
- Implement read receipt tracking
- Mobile polling fallback

**Week 3: UI & Integration**
- Build conversation list component
- Build message view component
- Add message input form
- Integrate chat into Order detail page (pilot)
- Integration tests & QA
- Deployment to staging

### 9.3 Database Deployment

```bash
# 1. Create schema
psql -f scripts/010_chat_schema.sql

# 2. Set up RLS policies
psql -f scripts/011_chat_rls_policies.sql

# 3. Seed default feature flags & permissions
psql -f scripts/012_chat_initial_data.sql

# 4. Run migrations in supabase-js
npm run migrate:up
```

---

## 10. PHASE 2 SPECIFICATION (Advanced - 2 weeks)

### 10.1 Feature Additions

**Threaded Replies:**
- Parent message can have nested thread
- `chat_threads` table tracks replies
- UI shows "3 replies" with expand button

**Typing Indicators:**
- Presence tracking via WebSocket
- Show "John is typing..." in real-time
- Auto-hide after 3 seconds of inactivity

**@Mentions:**
- Parse message content for @username
- Auto-complete user search
- Notify mentioned user
- Link to user profile in message

**Voice Messages:**
- Record audio up to 2 minutes
- Store in S3 with waveform visualization
- Playback in chat

### 10.2 Advanced Search

```sql
-- Full-text search on messages
CREATE TABLE public.messages_fts AS
SELECT id, conversation_id, content, ts_vector(content)
FROM messages;

CREATE INDEX messages_fts_idx ON messages_fts USING GIN(ts_vector);

-- Query
SELECT m.* FROM messages m
INNER JOIN messages_fts fts ON m.id = fts.id
WHERE fts.ts_vector @@ plainto_tsquery('english', 'shipping')
  AND m.conversation_id = $1;
```

---

## 11. SECURITY & COMPLIANCE

### 11.1 Message Encryption

**Transport Security:**
- All WebSocket connections use WSS (TLS 1.3)
- All API endpoints require HTTPS

**At-Rest Encryption:**
```sql
-- Optional: Encrypt sensitive message content
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted_content column
ALTER TABLE messages ADD COLUMN encrypted_content TEXT;

-- Encrypt on insert trigger
CREATE TRIGGER encrypt_message_content
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION pgcrypto.pgp_sym_encrypt(
  NEW.content, 'encryption-key'
);

-- Decrypt on select (handled in application layer with RLS)
```

### 11.2 Data Retention Policy

```sql
-- Archive old messages after 90 days (compliance requirement)
CREATE POLICY archive_old_messages ON messages
  USING (created_at > NOW() - INTERVAL '90 days')
  WITH CHECK (created_at > NOW() - INTERVAL '90 days');

-- Soft delete messages
UPDATE messages
SET deleted_at = NOW()
WHERE created_at < NOW() - INTERVAL '90 days'
  AND deleted_at IS NULL;

-- Hard delete after 1 year
DELETE FROM messages
WHERE deleted_at < NOW() - INTERVAL '1 year';
```

### 11.3 Chat Export & Compliance

**Admin endpoint to export chat history:**
```typescript
// POST /api/v1/admin/conversations/:conversationId/export
// Returns ZIP file with:
// - messages.json
// - attachments/
// - metadata.json (audit trail)

async function exportConversation(conversationId: string) {
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
  
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at');
  
  const { data: attachments } = await supabase
    .from('message_attachments')
    .select('*')
    .in('message_id', messages.map(m => m.id));
  
  // Zip and return
  const zip = new JSZip();
  zip.file('conversation.json', JSON.stringify(conversation, null, 2));
  zip.file('messages.json', JSON.stringify(messages, null, 2));
  // ... add attachments
  
  return zip.generateAsync({ type: 'blob' });
}
```

### 11.4 Audit Logs

```typescript
// Log all chat actions for compliance
async function logChatAction(
  businessId: string,
  userId: string,
  action: string,
  resourceId: string,
  changes?: object
) {
  await supabase
    .from('chat_audit_log')
    .insert({
      business_id: businessId,
      user_id: userId,
      action,
      resource_id: resourceId,
      changes: changes ? JSON.stringify(changes) : null,
      ip_address: getClientIP(),
      user_agent: getUserAgent(),
      created_at: new Date()
    });
}

// Usage
await logChatAction(
  businessId,
  userId,
  'message_deleted',
  messageId,
  { 
    originalContent: message.content,
    deletedAt: new Date().toISOString()
  }
);
```

---

## 12. SCALING CONSIDERATIONS

### 12.1 Expected Load Estimates

| Metric | Value | Notes |
|--------|-------|-------|
| Concurrent chat users | 5,000 | Peak hours, all businesses |
| Active conversations | 10,000 | Businesses with chat enabled |
| Messages per second | 50 | Average, varies by time |
| Peak TPS | 200 | During auctions/promotions |
| Message throughput/day | 4.3M | 50 msgs/sec × 86,400 sec |

### 12.2 Database Query Optimization

**Connection pooling:**
```typescript
// Use PgBouncer for connection pooling
// Supabase handles this automatically
const pool = new Pool({
  max: 20, // Max connections per instance
  idleTimeoutMillis: 30000,
});
```

**Query optimization:**
```sql
-- Avoid N+1: Fetch conversation + participants + last message in one query
SELECT c.*, 
  json_agg(
    json_build_object(
      'id', p->>'id',
      'role', p->>'role',
      'joined_at', p->>'joined_at'
    )
  ) as participants,
  (SELECT json_build_object(
    'id', m.id,
    'content', m.content,
    'senderName', u.name,
    'sentAt', m.sent_at
  ) FROM messages m
  LEFT JOIN users u ON u.id = m.sender_id
  WHERE m.conversation_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 1) as last_message
FROM conversations c,
  jsonb_array_elements(c.participants) AS p
WHERE c.business_id = $1
  AND c.status = 'active'
GROUP BY c.id
ORDER BY c.last_message_at DESC
LIMIT 20;
```

### 12.3 Caching Strategy

**Redis cache layer:**
```typescript
// Cache frequently accessed data with TTL
const CACHE_TTL = 300; // 5 minutes

async function getConversation(conversationId: string) {
  // Check cache
  const cached = await redis.get(`conv:${conversationId}`);
  if (cached) return JSON.parse(cached);
  
  // Query database
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
  
  // Cache result
  await redis.setex(`conv:${conversationId}`, CACHE_TTL, JSON.stringify(data));
  return data;
}

// Cache invalidation on updates
supabase
  .channel(`realtime:conversations`)
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'conversations' },
    (payload) => {
      redis.del(`conv:${payload.new.id}`);
    }
  )
  .subscribe();
```

### 12.4 Real-time Connection Pooling

**Connection limits per instance:**
```typescript
// Supabase Realtime can handle ~1000 concurrent connections per instance
// For 5000 concurrent users, scale to 5+ instances (autoscaling)

// Monitor connection count
const activeConnections = await supabase
  .from('realtime_stat')
  .select('connections_count')
  .single();

if (activeConnections.count > 900) {
  // Alert ops team for scaling
  await sendAlert('High Realtime connection usage');
}
```

### 12.5 Horizontal Scaling Architecture

```
                     ┌─────────────┐
                     │   CDN       │
                     │ (CloudFlare)│
                     └──────┬──────┘
                            │
                    ┌───────┴────────┐
                    │                │
              ┌─────▼──────┐  ┌──────▼─────┐
              │  API Pool  │  │  API Pool  │
              │  (2-4 nodes)  (2-4 nodes)  │
              └─────┬──────┘  └──────┬─────┘
                    │                │
                    └────────┬───────┘
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │
                    │   (nginx/Envoy) │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
      ┌─────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
      │ Supabase   │  │ Supabase    │  │ Supabase   │
      │ Realtime 1 │  │ Realtime 2  │  │ Realtime 3 │
      └─────┬──────┘  └──────┬──────┘  └─────┬──────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   (Supabase)    │
                    │   with Repl.    │
                    └─────────────────┘
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Database schema created and tested (run scripts/010-012)
- [ ] RLS policies enabled and verified
- [ ] Feature flag system tested
- [ ] API endpoints tested with Postman/Insomnia
- [ ] WebSocket connection tested in dev environment
- [ ] Push notification service configured (FCM/APNS)
- [ ] S3 bucket configured for attachments
- [ ] Rate limiting configured in API gateway
- [ ] Error handling and logging configured
- [ ] Security audit completed (OWASP Top 10)

### Staging Deployment

- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Load test: 500 concurrent users for 1 hour
- [ ] Stress test: Spike to 2000 concurrent users
- [ ] Network latency test (WebSocket reconnection)
- [ ] Push notification delivery test (iOS + Android)
- [ ] Database backup/recovery test
- [ ] Failover test (kill one Realtime instance)

### Production Deployment

- [ ] Feature flag disabled for all businesses initially
- [ ] Deploy to production with canary rollout (5% traffic)
- [ ] Monitor error rates, latency, WebSocket connections
- [ ] Gradually increase rollout to 25%, 50%, 100%
- [ ] Enable chat for select pilot businesses
- [ ] Monitor metrics for 1 week
- [ ] Gather feedback from pilot users
- [ ] Full rollout to all businesses
- [ ] Set up alerting for:
  - Message delivery latency > 1s
  - WebSocket disconnection rate > 1%
  - Database query latency > 500ms
  - API error rate > 0.5%

### Post-Deployment

- [ ] Document feature in user guide
- [ ] Set up monitoring dashboard
- [ ] Create on-call runbook for chat issues
- [ ] Schedule weekly chat system reviews (first month)
- [ ] Plan Phase 2 feature development
- [ ] Gather metrics and KPIs

---

## COST ESTIMATES

### Infrastructure Costs (Monthly)

| Component | Estimate | Notes |
|-----------|----------|-------|
| Supabase PostgreSQL | $500 | 2GB storage, auto-scaling |
| Supabase Realtime | $400 | 1M realtime events/month |
| Firebase Cloud Messaging | $50 | Free tier covers most |
| S3 (attachments) | $100 | Assuming 100GB storage |
| CloudFlare CDN | $200 | DDoS protection, caching |
| **Total** | **$1,250** | Per month |

### Development Costs

| Phase | Estimate | Resources |
|-------|----------|-----------|
| Phase 1 MVP | 280 hours | 1 Senior Backend + 1 Senior Frontend + 1 QA |
| Phase 2 Advanced | 120 hours | 1 Senior Backend + 1 Senior Frontend |
| **Total** | **400 hours** | ~2 months |

---

## REFERENCES & RESOURCES

**Supabase Documentation:**
- Realtime: https://supabase.com/docs/guides/realtime
- RLS: https://supabase.com/docs/guides/auth/row-level-security
- Postgres Extension: https://supabase.com/docs/guides/database/extensions

**Database Best Practices:**
- PostgreSQL Full-Text Search: https://www.postgresql.org/docs/current/textsearch.html
- JSONB Performance: https://www.postgresql.org/docs/current/datatype-json.html

**Real-time Messaging Patterns:**
- Event Sourcing: https://martinfowler.com/eaaDev/EventSourcing.html
- CQRS: https://martinfowler.com/bliki/CQRS.html

---

**Document prepared by:** Engineering Team  
**Last updated:** May 4, 2026  
**Next review:** June 4, 2026 (Phase 1 completion)
