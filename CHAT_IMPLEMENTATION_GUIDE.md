# Chat System Implementation Guide
## Redeem Rocket Real-Time Chat - Developer Quick Start

**Document Date:** May 4, 2026  
**Target Team:** Backend + Frontend Engineers  
**Estimated Time to Implement:** 3 weeks (MVP Phase 1)

---

## OVERVIEW

This guide provides a step-by-step implementation plan for the Redeem Rocket Real-Time Chat System. Detailed architecture specs are in `REALTIME_CHAT_SYSTEM_SPEC.md`.

---

## PHASE 1: DATABASE & API (Week 1)

### Task 1.1: Deploy Database Schema

**Time Estimate:** 4 hours

```bash
# 1. Navigate to Supabase dashboard
# 2. Open SQL Editor
# 3. Copy contents of scripts/010_chat_schema.sql
# 4. Execute in SQL Editor
# 5. Verify tables exist:

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'chat_%' OR table_name = 'conversations' OR table_name = 'messages';
```

**Verification Checklist:**
- [ ] `conversations` table created with 5 indexes
- [ ] `messages` table created with 6 indexes
- [ ] `message_attachments` table created
- [ ] `chat_threads` table created (Phase 2)
- [ ] `chat_settings` table created
- [ ] `business_features` table created
- [ ] `chat_role_permissions` table created
- [ ] `chat_audit_log` table created

### Task 1.2: Deploy RLS Policies

**Time Estimate:** 3 hours

```bash
# 1. Copy contents of scripts/011_chat_rls_policies.sql
# 2. Execute in Supabase SQL Editor
# 3. Verify policies created:

SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('conversations', 'messages', 'message_attachments', 'chat_settings')
ORDER BY tablename, policyname;
```

**Verification Checklist:**
- [ ] RLS enabled on all chat tables
- [ ] `conversations_select` policy created
- [ ] `messages_select` policy created
- [ ] `message_attachments_select` policy created
- [ ] Helper functions created (`is_conversation_participant`, etc.)
- [ ] Test RLS: Query as non-admin user should only return conversations they're in

### Task 1.3: Initialize Business Features & Permissions

**Time Estimate:** 2 hours

```bash
# 1. Copy contents of scripts/012_chat_initial_data.sql
# 2. Execute in Supabase SQL Editor
# 3. Verify data insertion:

SELECT COUNT(*) as business_features_count FROM public.business_features;
SELECT COUNT(*) as permissions_count FROM public.chat_role_permissions;
```

**Verification Checklist:**
- [ ] `business_features` row created for each business (chat_enabled = FALSE)
- [ ] `chat_role_permissions` rows created for customer, merchant, manager, admin roles
- [ ] All businesses have 4 permission roles defined

### Task 1.4: Build REST API Endpoints

**Time Estimate:** 20 hours

**Backend Framework:** Express.js + TypeScript  
**Location:** `src/app/api/chat-*.ts` or similar structure

#### Endpoint 1: POST /api/v1/conversations

```typescript
// src/app/api/chat-create-conversation.ts
import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { chatFeatureFlagMiddleware } from '../middleware/chat-feature-flag';

const router = Router();

router.post('/conversations',
  authMiddleware,
  chatFeatureFlagMiddleware,
  async (req, res) => {
    try {
      const { businessId, contextType, contextId, participantIds, title } = req.body;
      const userId = req.user.id;

      // Validation
      if (!businessId || !contextType || !['order', 'lead', 'auction', 'booking', 'coupon'].includes(contextType)) {
        return res.status(400).json({ error: 'Invalid parameters' });
      }

      // Check permission
      const hasPermission = await checkChatPermission(
        'can_initiate_chat',
        userId,
        businessId
      );
      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', businessId)
        .eq('context_type', contextType)
        .eq('context_id', contextId)
        .single();

      if (existing) {
        return res.status(409).json({
          error: 'Conversation already exists for this context',
          conversationId: existing.id
        });
      }

      // Build participants array
      const participants = [
        {
          id: userId,
          role: req.user.role,
          joined_at: new Date().toISOString()
        }
      ];

      // Add additional participants if provided
      if (participantIds && Array.isArray(participantIds)) {
        const { data: users } = await supabase
          .from('users')
          .select('id, role')
          .in('id', participantIds);

        participants.push(
          ...users.map(u => ({
            id: u.id,
            role: u.role,
            joined_at: new Date().toISOString()
          }))
        );
      }

      // Create conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          business_id: businessId,
          context_id: contextId,
          context_type: contextType,
          participants: JSON.stringify(participants),
          title: title || generateTitle(contextType, contextId),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Log to audit trail
      await logChatAction(businessId, userId, 'conversation_created', data[0].id);

      res.status(201).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

function generateTitle(contextType: string, contextId: string): string {
  // Auto-generate title based on context
  // This should fetch the actual order/lead/auction details
  return `${contextType.charAt(0).toUpperCase() + contextType.slice(1)} #${contextId.substring(0, 8)}`;
}

export default router;
```

#### Endpoint 2: POST /api/v1/conversations/:conversationId/messages

```typescript
// src/app/api/chat-send-message.ts
router.post('/conversations/:conversationId/messages',
  authMiddleware,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { content, messageType = 'text', replyToMessageId } = req.body;
      const userId = req.user.id;

      // Validate message
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content required' });
      }

      if (content.length > 5000) {
        return res.status(400).json({ error: 'Message too long (max 5000 chars)' });
      }

      // Get conversation to verify user is participant
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Verify user is participant
      const participants = JSON.parse(conversation.participants);
      const isParticipant = participants.some(p => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ error: 'Not a conversation participant' });
      }

      // Create message
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: content.trim(),
          message_type: messageType,
          status: 'sent',
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reply_to_message_id: replyToMessageId || null
        })
        .select();

      if (msgError) {
        return res.status(500).json({ error: msgError.message });
      }

      // Update conversation metadata
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_by: userId,
          message_count: conversation.message_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Broadcast via WebSocket (client will receive via realtime)
      // No need to explicitly broadcast - Realtime handles it

      // Log audit
      await logChatAction(conversation.business_id, userId, 'message_sent', message[0].id);

      res.status(201).json(message[0]);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
```

#### Endpoint 3: GET /api/v1/conversations/:conversationId/messages

```typescript
// Paginated message retrieval
router.get('/conversations/:conversationId/messages',
  authMiddleware,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const userId = req.user.id;

      // Verify access
      const { data: conv } = await supabase
        .from('conversations')
        .select('participants')
        .eq('id', conversationId)
        .single();

      if (!conv) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const participants = JSON.parse(conv.participants);
      if (!participants.some(p => p.id === userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Fetch messages with sender details
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          status,
          read_by,
          sent_at,
          created_at,
          users(id, name, role)
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Count total messages
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .is('deleted_at', null);

      res.json({
        messages: messages.reverse(), // Reverse for chronological order
        pagination: {
          total: count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < count
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
```

#### Endpoint 4: PUT /api/v1/conversations/:conversationId/read

```typescript
// Mark messages as read
router.put('/conversations/:conversationId/read',
  authMiddleware,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { messageIds } = req.body;
      const userId = req.user.id;
      const readAt = new Date().toISOString();

      // Get all unread messages in conversation
      const query = supabase
        .from('messages')
        .select('id, read_by')
        .eq('conversation_id', conversationId)
        .in('status', ['sent', 'delivered']);

      if (messageIds && Array.isArray(messageIds)) {
        query.in('id', messageIds);
      }

      const { data: messages } = await query;

      if (!messages || messages.length === 0) {
        return res.json({ conversationId, readCount: 0 });
      }

      // Update messages
      const updatePromises = messages.map(msg => {
        const readBy = JSON.parse(msg.read_by || '[]');
        if (!readBy.some(r => r.userId === userId)) {
          readBy.push({ userId, readAt });
        }

        return supabase
          .from('messages')
          .update({
            read_by: JSON.stringify(readBy),
            status: 'read'
          })
          .eq('id', msg.id);
      });

      await Promise.all(updatePromises);

      // Broadcast read receipts via Realtime
      // Client subscribes to conversation changes

      res.json({
        conversationId,
        readCount: messages.length,
        readAt
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
```

**Remaining Endpoints to Implement:**
- POST /api/v1/conversations/:conversationId/attachments (file upload)
- PUT /api/v1/conversations/:conversationId/archive (archive conversation)
- GET /api/v1/conversations (list conversations)
- DELETE /api/v1/messages/:messageId (soft delete)

**Testing Strategy:**
```bash
# Use Postman/Insomnia to test each endpoint:
# 1. Create conversation
# 2. Send message
# 3. Get messages
# 4. Mark as read
# 5. Verify RLS: non-participant should get 403
```

### Task 1.5: Setup Feature Flag Middleware

**Time Estimate:** 2 hours

```typescript
// src/middleware/chat-feature-flag.ts
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { redis } from '../lib/redis';

export async function chatFeatureFlagMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { businessId } = req.params;

  if (!businessId) {
    return res.status(400).json({ error: 'Business ID required' });
  }

  // Check cache first
  const cacheKey = `chat-feature:${businessId}`;
  let featureFlag = await redis.get(cacheKey);

  if (!featureFlag) {
    const { data } = await supabase
      .from('business_features')
      .select('chat_enabled, chat_tier, chat_max_messages_per_day')
      .eq('business_id', businessId)
      .single();

    if (!data) {
      return res.status(404).json({ error: 'Business not found' });
    }

    featureFlag = data;
    await redis.setex(cacheKey, 300, JSON.stringify(featureFlag));
  } else {
    featureFlag = JSON.parse(featureFlag);
  }

  if (!featureFlag.chat_enabled) {
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
```

### Task 1.6: Setup Rate Limiting

**Time Estimate:** 1 hour

```typescript
// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const chatMessageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 messages per minute per user
  keyGenerator: (req) => `${req.user.id}:${req.params.conversationId}`,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many messages. Please slow down.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

export const chatConversationLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000, // 1 hour
  max: 50, // 50 conversations per hour per user
  keyGenerator: (req) => req.user.id,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many conversations. Please try again later.'
    });
  }
});
```

---

## PHASE 2: REAL-TIME & NOTIFICATIONS (Week 2)

### Task 2.1: Integrate Supabase Realtime

**Time Estimate:** 8 hours

```typescript
// src/hooks/useRealtimeChat.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeChat(conversationId: string) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to message changes
    const messagesChannel = supabase
      .channel(`conversation:${conversationId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message change:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new message
            setMessages(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            // Update message (read status, etc.)
            setMessages(prev =>
              prev.map(m => m.id === payload.new.id ? payload.new : m)
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove message
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to presence (typing indicators)
    const presenceChannel = supabase
      .channel(`conversation:${conversationId}:presence`, {
        config: {
          presence: {
            key: 'user'
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typing = new Set<string>();

        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.typing) {
              typing.add(presence.user_id);
            }
          });
        });

        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            typing: false
          });
        }
      });

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [conversationId]);

  return { messages, typingUsers };
}
```

### Task 2.2: Implement Push Notifications

**Time Estimate:** 8 hours

```typescript
// src/services/push-notifications.ts
import admin from 'firebase-admin';

export async function sendPushNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
) {
  try {
    // Get user's FCM tokens
    const { data: user } = await supabase
      .from('users')
      .select('fcm_tokens')
      .eq('id', userId)
      .single();

    if (!user?.fcm_tokens || user.fcm_tokens.length === 0) {
      return;
    }

    // Send notification to all tokens
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      webpush: {
        fcmOptions: {
          link: '/chat'
        }
      },
      data: notification.data || {}
    };

    const response = await admin.messaging().sendMulticast({
      tokens: user.fcm_tokens,
      ...message
    });

    console.log(`Sent ${response.successCount} notifications`);

    // Update failed tokens
    if (response.failureCount > 0) {
      const failedTokens = response.responses
        .map((r, i) => (r.success ? null : user.fcm_tokens[i]))
        .filter(Boolean);

      await supabase
        .from('users')
        .update({
          fcm_tokens: user.fcm_tokens.filter(t => !failedTokens.includes(t))
        })
        .eq('id', userId);
    }
  } catch (error) {
    console.error('Push notification error:', error);
  }
}

// Call this when a new message is sent
export async function notifyNewMessage(
  conversationId: string,
  message: Message,
  conversation: Conversation
) {
  const recipients = conversation.participants
    .filter(p => p.id !== message.senderId)
    .map(p => p.id);

  for (const recipientId of recipients) {
    const { data: settings } = await supabase
      .from('chat_settings')
      .select('notifications_enabled, notification_type, muted_conversations')
      .eq('user_id', recipientId)
      .eq('business_id', conversation.businessId)
      .single();

    if (!settings?.notifications_enabled) continue;
    if (settings.muted_conversations?.includes(conversationId)) continue;

    if (settings.notification_type === 'push' || settings.notification_type === 'all') {
      await sendPushNotification(recipientId, {
        title: conversation.title || 'New message',
        body: message.content.substring(0, 100),
        data: {
          conversationId,
          messageId: message.id,
          contextType: conversation.contextType
        }
      });
    }
  }
}
```

### Task 2.3: Build In-App Notification UI

**Time Estimate:** 6 hours

```typescript
// src/components/ChatNotificationCenter.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function ChatNotificationCenter() {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const userId = supabase.auth.user()?.id;
    if (!userId) return;

    // Subscribe to conversation changes for this user
    const channel = supabase
      .channel('chat-notifications')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          updateUnreadCounts();
        }
      )
      .subscribe();

    updateUnreadCounts();

    return () => supabase.removeChannel(channel);
  }, []);

  async function updateUnreadCounts() {
    const userId = supabase.auth.user()?.id;
    if (!userId) return;

    // This is a simplified approach - in production, you'd want
    // to track unread per user per conversation more efficiently
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, unread_count')
      .filter('participants', 'cs', `[{"id":"${userId}"}]`);

    const counts: Record<string, number> = {};
    conversations?.forEach(c => {
      counts[c.id] = c.unread_count;
    });

    setUnreadCounts(counts);
  }

  return (
    <div className="notification-center">
      {Object.entries(unreadCounts).map(([convId, count]) => (
        count > 0 && (
          <div key={convId} className="notification-badge">
            {count} unread messages
          </div>
        )
      ))}
    </div>
  );
}
```

---

## PHASE 3: UI & INTEGRATION (Week 3)

### Task 3.1: Build Conversation List Component

**Time Estimate:** 6 hours

```typescript
// src/components/ChatConversationList.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export function ChatConversationList({ businessId, onSelect }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`conversations:${businessId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          loadConversations();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [businessId]);

  async function loadConversations() {
    const { data: userId } = await supabase.auth.user();
    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        messages(id, content, sent_at, users(name))
      `)
      .eq('business_id', businessId)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false });

    setConversations(data || []);
    setLoading(false);
  }

  if (loading) return <div>Loading conversations...</div>;

  return (
    <div className="conversation-list">
      {conversations.map(conv => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          onClick={() => onSelect(conv)}
        />
      ))}
    </div>
  );
}

function ConversationItem({ conversation, onClick }) {
  const lastMessage = conversation.messages?.[0];

  return (
    <div className="conversation-item" onClick={onClick}>
      <div className="conversation-title">{conversation.title}</div>
      <div className="conversation-preview">
        {lastMessage?.content.substring(0, 50)}...
      </div>
      <div className="conversation-time">
        {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
      </div>
      {conversation.unread_count > 0 && (
        <badge className="unread-badge">{conversation.unread_count}</badge>
      )}
    </div>
  );
}
```

### Task 3.2: Build Message View Component

**Time Estimate:** 6 hours

```typescript
// src/components/ChatMessageView.tsx
import React, { useEffect, useState } from 'react';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { supabase } from '../lib/supabase';

export function ChatMessageView({ conversationId, onClose }) {
  const { messages, typingUsers } = useRealtimeChat(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: supabase.auth.user()?.id,
          content: newMessage,
          message_type: 'text'
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="message-view">
      <div className="messages-list">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {typingUsers.size > 0 && (
          <TypingIndicator count={typingUsers.size} />
        )}
      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

function ChatMessage({ message }) {
  return (
    <div className="chat-message" data-status={message.status}>
      <div className="message-sender">{message.sender?.name}</div>
      <div className="message-content">{message.content}</div>
      <div className="message-time">
        {new Date(message.sent_at).toLocaleTimeString()}
      </div>
      {message.read_by?.length > 0 && (
        <div className="message-status">✓✓ Read</div>
      )}
    </div>
  );
}

function TypingIndicator({ count }) {
  return (
    <div className="typing-indicator">
      {count} user{count > 1 ? 's' : ''} typing...
    </div>
  );
}
```

### Task 3.3: Integrate Chat into Order Detail Page

**Time Estimate:** 4 hours

```typescript
// src/pages/OrderDetail.tsx
import { ChatConversationList, ChatMessageView } from '../components/Chat';

export function OrderDetail({ orderId }) {
  const [showChat, setShowChat] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <div className="order-detail">
      <div className="order-info">
        {/* Order details */}
      </div>

      {showChat && (
        <div className="chat-panel">
          {!selectedConversation ? (
            <ChatConversationList
              businessId={order.businessId}
              contextType="order"
              contextId={orderId}
              onSelect={setSelectedConversation}
            />
          ) : (
            <ChatMessageView
              conversationId={selectedConversation.id}
              onClose={() => setSelectedConversation(null)}
            />
          )}
        </div>
      )}

      <button onClick={() => setShowChat(!showChat)}>
        {showChat ? 'Close Chat' : 'Open Chat'}
      </button>
    </div>
  );
}
```

---

## TESTING STRATEGY

### Unit Tests

```bash
# Test database functions
npm run test -- tests/db/chat-functions.test.ts

# Test API endpoints
npm run test -- tests/api/chat-endpoints.test.ts

# Test RLS policies
npm run test -- tests/db/chat-rls.test.ts
```

### Integration Tests

```bash
# Test full flow: conversation creation -> message sending -> read receipt
npm run test:integration -- tests/chat-flow.test.ts

# Test real-time message delivery
npm run test:integration -- tests/realtime-messaging.test.ts
```

### Load Testing

```bash
# Stress test with 500 concurrent users
artillery quick --count 500 --num 100 http://localhost:3000/api/v1/conversations

# Monitor WebSocket connections
watch -n 1 'curl http://localhost:3000/health/realtime-connections'
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment (Week 3)

- [ ] All API endpoints implemented and tested
- [ ] RLS policies tested with non-admin users
- [ ] Feature flag system working
- [ ] Push notifications configured
- [ ] Error handling and logging in place
- [ ] Rate limiting configured
- [ ] Database backups configured
- [ ] Monitoring and alerting setup

### Staging Deployment

- [ ] Deploy to staging environment
- [ ] Run full integration test suite
- [ ] Load test: 500 concurrent users
- [ ] Manual testing of all flows
- [ ] Test on mobile (iOS + Android)
- [ ] Verify push notifications
- [ ] Check error logs

### Production Deployment

```bash
# 1. Enable feature flag for 5% of businesses
UPDATE business_features
SET chat_enabled = TRUE
WHERE random() < 0.05
AND chat_enabled = FALSE;

# 2. Monitor metrics
# - API latency
# - Error rate
# - WebSocket connections
# - Database query time

# 3. Gradual rollout
# Week 1: 5% of businesses
# Week 2: 25% of businesses
# Week 3: 100% of businesses
```

---

## MONITORING & OBSERVABILITY

### Key Metrics to Track

```typescript
// src/services/metrics.ts
export async function trackChatMetric(
  name: string,
  value: number,
  tags: Record<string, string> = {}
) {
  // Send to DataDog/NewRelic
  client.gauge(name, value, { tags });
}

// Usage in endpoints
trackChatMetric('chat.message.sent', 1, { businessId, contextType });
trackChatMetric('chat.message.latency', latencyMs, { businessId });
trackChatMetric('chat.concurrent.users', activeConnections, {});
```

### Alerting Rules

```yaml
# DataDog monitors
- name: Chat API High Latency
  query: avg(last_5m):avg:chat.message.latency{*} > 1000
  alert: true

- name: Chat Error Rate High
  query: avg(last_5m):avg:chat.api.error_rate{*} > 0.01
  alert: true

- name: WebSocket Connection Drop
  query: avg(last_1m):avg:chat.realtime.connections{*} < 100
  alert: true
```

---

## SUPPORT & DOCUMENTATION

### For Users

- [ ] Add "Chat" feature to help documentation
- [ ] Create video tutorial for chat usage
- [ ] Add FAQ about notification settings

### For Operations

- [ ] Create runbook for common chat issues
- [ ] Document troubleshooting steps
- [ ] Set up on-call process for chat incidents

---

## NEXT STEPS (Phase 2)

After Phase 1 MVP deployment:

1. **Gather feedback** from early users (1 week)
2. **Analyze metrics** - message volume, concurrent users, latency
3. **Plan Phase 2 features**:
   - Threaded replies
   - Typing indicators
   - @mentions
   - Voice messages
   - Advanced search

4. **Optimize based on learnings**
   - Cache strategies
   - Query optimization
   - Connection pooling

---

**Document Prepared By:** Engineering Team  
**Last Updated:** May 4, 2026  
**Questions?** Contact: engineering@redeemrocket.com
