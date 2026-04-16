# Growth Platform Integration Starter Guide

This guide shows how to start integrating the deployed Growth Platform edge functions into the redeemrocket.in application.

---

## Quick Start: Add Leads Management

### 1. Create Leads Page Component

Create `business-app/frontend/src/pages/Leads.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setLeads(data || [])
      } catch (err) {
        console.error('Failed to fetch leads:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [])

  if (loading) return <div>Loading leads...</div>

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Leads</h1>
      
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Source</th>
            <th className="border p-2">Stage</th>
            <th className="border p-2">Priority</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr key={lead.id}>
              <td className="border p-2">{lead.name}</td>
              <td className="border p-2">{lead.email}</td>
              <td className="border p-2">{lead.phone}</td>
              <td className="border p-2">{lead.source}</td>
              <td className="border p-2">{lead.stage}</td>
              <td className="border p-2">{lead.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### 2. Add Leads to Navigation

Edit `business-app/frontend/src/components/Navigation.tsx` and add:

```typescript
<Link to="/leads" className="nav-link">
  📊 Leads
</Link>
```

### 3. Add Route

Edit `business-app/frontend/src/App.tsx` or your router config:

```typescript
import Leads from './pages/Leads'

// In your routes:
<Route path="/leads" element={<Leads />} />
```

---

## Webhook Integration Example

### Call the Lead Ingest Function

From anywhere in your app:

```typescript
async function importLead(leadData: any) {
  const response = await fetch(
    'https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/lead-ingest',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        source_type: 'webhook',
        business_id: 'your-business-id',
        data: leadData
      })
    }
  )

  return response.json()
}
```

---

## Email Sequences Integration

### Create Email Sequence

```typescript
async function createEmailSequence(sequence: any) {
  const { data, error } = await supabase
    .from('email_sequences')
    .insert({
      business_id: 'your-business-id',
      sequence_name: sequence.name,
      trigger_type: 'signup', // or 'manual', 'api'
      step_number: 1,
      step_delay_days: 0,
      email_subject: sequence.subject,
      email_body: sequence.body,
      is_active: true
    })

  if (error) throw error
  return data
}
```

### Schedule Email Processing

The function runs daily. To test manually:

```typescript
async function triggerEmailSequences() {
  const response = await fetch(
    'https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/process-email-sequences',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        business_id: 'your-business-id'
      })
    }
  )

  return response.json()
}
```

---

## Automation Rules Integration

### Create Automation Rule

```typescript
async function createAutomationRule(rule: any) {
  const { data, error } = await supabase
    .from('automation_rules')
    .insert({
      business_id: 'your-business-id',
      rule_name: rule.name,
      trigger_type: 'lead_added',
      trigger_conditions: rule.conditions,
      action_type: rule.action,
      action_config: rule.config,
      is_active: true
    })

  if (error) throw error
  return data
}
```

### Execute Rules

The function runs hourly. To test manually:

```typescript
async function executeAutomationRules() {
  const response = await fetch(
    'https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/execute-automation-rules',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        business_id: 'your-business-id'
      })
    }
  )

  return response.json()
}
```

---

## Social Media Integration

### Create Social Account

```typescript
async function connectSocialAccount(platform: string, credentials: any) {
  const { data, error } = await supabase
    .from('social_accounts')
    .insert({
      business_id: 'your-business-id',
      platform,
      account_name: credentials.accountName,
      account_id: credentials.accountId,
      access_token: credentials.token,
      is_connected: true
    })

  if (error) throw error
  return data
}
```

### Publish Social Post

```typescript
async function publishSocialPost(post: any) {
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('id')
    .eq('platform', post.platform)
    .limit(1)

  if (!accounts || accounts.length === 0) {
    throw new Error('No connected social account found')
  }

  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      business_id: 'your-business-id',
      social_account_id: accounts[0].id,
      platform: post.platform,
      post_content: post.content,
      post_type: 'text',
      status: 'draft'
    })

  if (error) throw error

  // Publish immediately
  const response = await fetch(
    'https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/publish-social-post',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        post_id: data[0].id,
        business_id: 'your-business-id'
      })
    }
  )

  return response.json()
}
```

---

## Configure Email Providers

Set up email delivery:

```typescript
async function setupEmailProvider(provider: any) {
  const { data, error } = await supabase
    .from('email_provider_configs')
    .insert({
      business_id: 'your-business-id',
      provider_type: provider.type, // 'resend', 'smtp', 'aws_ses'
      provider_name: provider.name,
      is_verified: false,
      is_primary: true,
      config_data: provider.config
    })

  if (error) throw error

  // Verify the provider
  const response = await fetch(
    'https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/verify-email-provider',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        provider_id: data[0].id,
        business_id: 'your-business-id'
      })
    }
  )

  return response.json()
}
```

---

## Important: Get Business ID

Replace `'your-business-id'` with the actual business ID. From your auth store:

```typescript
import { useAuthStore } from '../stores/authStore'

const { user } = useAuthStore()
const businessId = user?.business_id // or however it's stored
```

---

## Environment Variables Required

Ensure your `.env` (or `.env.local`) has:

```
VITE_SUPABASE_URL=https://eomqkeoozxnttqizstzk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Next: UI Pages to Build

1. **Leads Management**
   - List, search, filter leads
   - View lead details
   - Import CSV/webhook
   - Edit lead information

2. **Email Campaigns**
   - Create/edit sequences
   - Set triggers and delays
   - View send history
   - Track opens/clicks

3. **Automation Rules**
   - Create conditional rules
   - Set trigger/action pairs
   - View execution logs
   - Test rules before activation

4. **Social Media**
   - Connect accounts
   - Compose posts
   - Schedule posts
   - View analytics

5. **Webhooks**
   - Generate webhook URLs
   - Test webhook delivery
   - View webhook logs

---

## Helpful Resources

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Client (JavaScript):** https://supabase.com/docs/reference/javascript
- **Edge Functions:** https://supabase.com/docs/guides/functions
- **RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security

