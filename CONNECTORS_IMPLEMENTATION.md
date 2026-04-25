# Lead Connectors Module - Complete Implementation Guide

## Overview
The Lead Connectors module provides a comprehensive system for ingesting leads from multiple sources including webhooks, phone systems (IVR), databases, and social media platforms. This is the final growth platform module that enables businesses to consolidate leads from all their revenue channels.

## Architecture

### Components
- **WebhookConnector** (`src/business/components/LeadConnectors/WebhookConnector.tsx`) - HTTP webhook integration with field mapping
- **IVRConnector** (`src/business/components/LeadConnectors/IVRConnector.tsx`) - Phone system integration (Twilio, Bandwidth, Vonage)
- **DatabaseConnector** (`src/business/components/LeadConnectors/DatabaseConnector.tsx`) - SQL database sync (PostgreSQL, MySQL, Oracle, MSSQL)
- **SocialOAuthConnector** (`src/business/components/LeadConnectors/SocialOAuthConnector.tsx`) - Social media OAuth (Twitter, LinkedIn, Facebook, Instagram, TikTok)
- **ConnectorsPage** (`src/business/components/ConnectorsPage.tsx`) - Main UI for connector management

### Hooks
- **useConnectors** (`src/business/hooks/useConnectors.ts`) - State management for connector operations

### Edge Functions
- **connector-operations** (`supabase/functions/connector-operations/index.ts`) - Test webhook, IVR, database connectors
- **social-oauth** (`supabase/functions/social-oauth/index.ts`) - OAuth authorization and token exchange

### Types
- **growth-platform.ts** (`src/business/types/growth-platform.ts`) - TypeScript interfaces for all connector-related data

## Features

### 1. Webhook Connector
- **Field Mapping**: Map incoming JSON fields to lead properties (name, email, phone, company, product_interest, deal_value)
- **Field Testing**: Validate webhook payloads before saving
- **Example Payloads**: Provide template for integrations (Zapier, Make.com, etc.)
- **Automatic Lead Ingestion**: Leads created immediately when webhook fires
- **Error Handling**: Track failed imports and retry logic

**Webhook URL Format**:
```
https://[your-domain]/functions/v1/lead-ingest?connector_id=[id]
```

**Example Payload**:
```json
{
  "leads": [
    {
      "full_name": "John Doe",
      "email_address": "john@example.com",
      "phone_number": "5551234567",
      "company_name": "ACME Corp",
      "product": "Enterprise Plan",
      "deal_size": 50000
    }
  ]
}
```

### 2. IVR Connector
- **Provider Support**: Twilio, Bandwidth, Vonage, Custom APIs
- **Intent Mapping**: Link IVR menu options (press 1, 2, 3) to lead intents (inquiry, complaint, support, sales)
- **Auto Lead Creation**: Automatically create leads from specific intents
- **Call Metadata**: Capture call duration, phone number, IVR responses
- **Connection Testing**: Verify API credentials before saving

**Supported Intents**:
- `inquiry` - General product questions
- `complaint` - Customer issues/complaints
- `support` - Technical support requests
- `sales` - Direct sales leads

### 3. Database Connector
- **Database Support**: PostgreSQL, MySQL, Oracle, MSSQL
- **Query Templating**: Pre-built templates for common databases
- **Column Mapping**: Use SQL aliases (as name, as email, etc.) for field mapping
- **Sync Scheduling**: Hourly, Daily, Weekly, or Manual-only
- **Connection Testing**: Validate query and connection before saving
- **Security**: Read-only queries enforced, dangerous keywords blocked

**Required Column Aliases**:
- `as name` - Lead name (required)
- `as email` - Lead email (optional)
- `as phone` - Lead phone (optional)
- `as company` - Company name (optional)
- `as product_interest` - Product/service (optional)
- `as deal_value` - Deal amount (optional)

**PostgreSQL Example**:
```sql
SELECT
  first_name || ' ' || last_name as name,
  email,
  phone,
  company,
  product as product_interest,
  deal_value
FROM leads
WHERE created_at > NOW() - INTERVAL '7 days'
AND status = 'active'
LIMIT 100;
```

### 4. Social OAuth Connector
- **Platforms**: Twitter/X, LinkedIn, Facebook, Instagram, TikTok
- **OAuth Flow**: Complete OAuth 2.0 implementation
- **Data Extraction**: Mentions, followers, comments, messages
- **Auto-sync**: Hourly, Daily, or Weekly syncing
- **Account Linking**: Connect multiple social accounts per platform
- **Token Management**: Automatic refresh token handling

**Extracted Data**:
- Profile mentions and tags
- Engagement metrics (likes, shares, comments)
- Follower/connection data
- Direct messages
- Post interactions

### 5. Smart Lead Creation
All connectors automatically create leads with:
- **Status**: "new" (pending qualification)
- **Priority**: "medium" (configurable per connector)
- **Source**: Tracks connector type
- **Metadata**: Full connector context stored

## Database Schema

### lead_connectors table
```sql
CREATE TABLE lead_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  connector_name VARCHAR(255) NOT NULL,
  connector_type VARCHAR(50) NOT NULL,
  source_name VARCHAR(255),
  webhook_url VARCHAR(2048),
  api_key TEXT,
  form_embed_code TEXT,
  field_mapping JSONB,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_count INT DEFAULT 0,
  auth_token TEXT,
  auth_secret TEXT,
  connection_string TEXT,
  database_type VARCHAR(50),
  query_template TEXT,
  last_error TEXT,
  error_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Related Tables
- `ivr_leads` - IVR call data and responses
- `web_portal_submissions` - Form submissions
- `scraped_leads` - Web scraping results
- `database_sync_logs` - Database sync history
- `social_accounts` - Connected social accounts
- `connector_activity_logs` - Activity tracking

## API Endpoints

### Connector Operations
**POST** `/functions/v1/connector-operations`

Operations:
- `test-webhook` - Validate webhook payload format
- `test-ivr` - Verify IVR provider credentials
- `test-database` - Test database connection and query
- `test-social` - Validate social OAuth token
- `sync-database` - Execute database sync
- `log-activity` - Log connector activity

### Social OAuth
**POST** `/functions/v1/social-oauth`

Actions:
- `authorize` - Generate OAuth authorization URL
- `exchange` - Exchange auth code for access token
- `get-user-info` - Fetch user profile from platform
- `link-account` - Link social account to business

## Usage

### Creating a Webhook Connector
```tsx
const { createConnector } = useConnectors()

await createConnector({
  connector_name: 'Zapier Integration',
  connector_type: 'webhook',
  field_mapping: {
    'full_name': 'name',
    'email': 'email',
    'phone': 'phone',
    'company': 'company',
    'product': 'product_interest',
    'deal_amount': 'deal_value'
  },
  webhook_url: 'https://...',
  is_active: true
})
```

### Testing a Connector
```tsx
const { testConnector } = useConnectors()

const result = await testConnector(connectorId)
// Returns: { success: true, valid_count: 5, invalid_count: 0, errors: [] }
```

### Syncing a Database Connector
```tsx
const { syncConnector } = useConnectors()

const result = await syncConnector(connectorId)
// Returns: { success: true, synced_count: 150, failed_count: 5, message: '...' }
```

## Security Considerations

### Webhook Security
- Validate incoming JSON structure
- Implement rate limiting
- Use HTTPS only
- Validate sender IP if possible
- Hash webhook URLs

### Database Security
- Use read-only database credentials
- Implement IP whitelisting
- Encrypt connection strings
- Rotate credentials regularly
- Log all queries executed

### OAuth Security
- Use PKCE flow (authorization code + code challenge)
- Validate state parameter
- Encrypt stored access tokens
- Implement token refresh automatically
- Clear tokens on account disconnect

### Data Security
- All sensitive data encrypted at rest
- HTTPS in transit
- Row-level security (RLS) enforced
- Business ID isolation
- Audit logging

## Monitoring & Troubleshooting

### Activity Logs
Track all connector activity:
- Sync attempts and results
- API errors and failures
- Field mapping changes
- Account connections/disconnections

### Common Issues

**Webhook not receiving leads**:
1. Verify webhook URL is correct
2. Check field mapping matches your data
3. Test with sample payload
4. Check firewall/network rules

**Database sync failing**:
1. Verify connection string
2. Test SQL query manually
3. Check for required column aliases
4. Verify read permissions

**OAuth token expired**:
1. Automatic refresh should handle it
2. If manual, disconnect and reconnect
3. Check token expiration time
4. Verify app still has permissions

## Performance Optimization

- Database queries limited to 100 records per sync
- Webhook payloads processed asynchronously
- Rate limiting: 450 requests/15 minutes per platform
- Batch import for CSV/database connectors
- Caching for OAuth tokens (with auto-refresh)

## Future Enhancements

1. **AI-Powered Lead Scoring**: Automatic lead scoring based on source
2. **Advanced Filtering**: Filter/transform leads during ingestion
3. **Duplicate Detection**: Intelligent duplicate handling across sources
4. **Custom Webhooks**: Allow users to define custom webhook handlers
5. **Real-time Sync**: WebSocket support for real-time updates
6. **Advanced Scheduling**: Cron expressions for sync timing
7. **Data Validation**: Custom validation rules per connector
8. **Webhook Signing**: HMAC signature verification
9. **Retry Logic**: Exponential backoff for failed imports
10. **Analytics**: Detailed connector performance metrics

## Deployment Checklist

- [ ] Environment variables configured for OAuth providers
- [ ] Supabase edge functions deployed
- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] Webhook URLs configured in integrations
- [ ] IVR callbacks configured in phone provider
- [ ] Social OAuth apps created on platforms
- [ ] Database credentials encrypted
- [ ] Rate limiting configured
- [ ] Monitoring and alerts set up
- [ ] Documentation updated
- [ ] User training completed
- [ ] Testing in production-like environment
- [ ] Rollback plan prepared

## File Structure

```
src/business/
├── components/
│   ├── LeadConnectors/
│   │   ├── WebhookConnector.tsx
│   │   ├── IVRConnector.tsx
│   │   ├── DatabaseConnector.tsx
│   │   └── SocialOAuthConnector.tsx
│   └── ConnectorsPage.tsx
├── hooks/
│   └── useConnectors.ts
├── types/
│   ├── growth-platform.ts
│   └── index.ts
└── routes.tsx

supabase/
├── functions/
│   ├── connector-operations/
│   │   └── index.ts
│   ├── social-oauth/
│   │   └── index.ts
│   └── lead-ingest/
│       └── index.ts
└── migrations/
    ├── 20260417_expanded_lead_sources.sql
    └── 20240023_activity_logs.sql
```

## Support & Documentation

- See `LEADS_MODULE_INDEX.md` for complete growth platform documentation
- Check connector-specific guides in component files
- Review type definitions in `growth-platform.ts`
- Test edge functions in Supabase dashboard

## License & Attribution

This implementation follows enterprise-grade patterns for:
- Multi-source data integration
- OAuth 2.0 security standards
- SQL injection prevention
- Rate limiting and throttling
- Comprehensive error handling
- TypeScript type safety
