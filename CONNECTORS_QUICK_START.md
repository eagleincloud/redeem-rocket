# Lead Connectors - Quick Start Guide

## Setup (5 minutes)

### 1. Deploy Edge Functions
```bash
cd supabase/functions/connector-operations
supabase functions deploy

cd ../social-oauth
supabase functions deploy
```

### 2. Apply Database Migration
```bash
supabase db pull  # If first time
supabase migration up
```

### 3. Configure Environment Variables
Add to `.env.local`:
```env
# Social OAuth (get from developer consoles)
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
FACEBOOK_CLIENT_ID=your_client_id
FACEBOOK_CLIENT_SECRET=your_client_secret
INSTAGRAM_CLIENT_ID=your_client_id
INSTAGRAM_CLIENT_SECRET=your_client_secret
TIKTOK_CLIENT_ID=your_client_id
TIKTOK_CLIENT_SECRET=your_client_secret
```

### 4. Start Using Connectors
Navigate to `/app/connectors` in the app.

## Common Tasks

### Create a Webhook Connector

1. Click "Webhook" button on Connectors page
2. Enter connector name: "Zapier Integration"
3. Add field mappings:
   - `full_name` → `name`
   - `email` → `email`
   - `phone` → `phone`
   - `company` → `company`
   - `product` → `product_interest`
   - `deal_amount` → `deal_value`
4. Copy webhook URL
5. Click "Test Webhook" with sample payload
6. Save connector

**Test Payload**:
```json
{
  "leads": [
    {
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "5551234567",
      "company": "ACME Corp",
      "product": "Enterprise",
      "deal_amount": 50000
    }
  ]
}
```

### Set Up IVR Integration

1. Click "IVR" button
2. Select provider (e.g., "Twilio")
3. Enter IVR phone number: "+1 (555) 123-4567"
4. Add auth credentials from provider dashboard
5. Map intents:
   - Option "1" → `sales` (auto-create lead)
   - Option "2" → `support` (manual review)
   - Option "3" → `complaint` (manual review)
6. Test connection
7. Configure webhook callback in Twilio dashboard

**Twilio Webhook**:
```
POST {your-domain}/functions/v1/ingest-advanced-leads
Parameters: connector_id, phone_number, ivr_response, call_duration
```

### Connect Database Sync

1. Click "Database" button
2. Select database type (e.g., "PostgreSQL")
3. Enter connection string: `postgresql://user:pass@host:5432/dbname`
4. Use template or enter custom SQL query
5. Test connection and query
6. Set sync schedule (e.g., "Daily at 2 AM")
7. Save connector

**Connection String Format**:
- PostgreSQL: `postgresql://user:pass@host:5432/dbname`
- MySQL: `mysql://user:pass@host:3306/dbname`
- Oracle: `oracle://user:pass@host:1521/ORCL`
- MSSQL: `mssql://user:pass@host:1433/dbname`

### Authorize Social Account

1. Click platform button (Twitter, LinkedIn, Facebook, Instagram, or TikTok)
2. Click "Connect [Platform] Account"
3. Approve permissions in platform popup
4. Connector auto-saves after authorization
5. Configure data extraction options
6. Set sync schedule

**OAuth Scopes Required**:
- Twitter: `tweet.read users.read follows.read`
- LinkedIn: `r_basicprofile r_emailaddress`
- Facebook: `pages_manage_metadata leads_retrieval`
- Instagram: `instagram_basic instagram_manage_messages`
- TikTok: `user.info.basic video.list`

## API Usage

### Test Webhook (From Code)
```typescript
const response = await fetch('/functions/v1/connector-operations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'test-webhook',
    connector_type: 'webhook',
    payload: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  })
})
const result = await response.json()
```

### Trigger Database Sync
```typescript
const { syncConnector } = useConnectors()
const result = await syncConnector(connectorId)
// Returns: { success: true, synced_count: 150, failed_count: 5 }
```

### Manual Lead Ingestion (Webhook)
```bash
curl -X POST https://your-domain/functions/v1/lead-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "your-business-id",
    "source_type": "webhook",
    "connector_id": "connector-id",
    "leads": [
      {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "5551234567",
        "company": "ACME Corp",
        "product_interest": "Enterprise",
        "deal_value": 50000
      }
    ]
  }'
```

## Troubleshooting

### Webhook Not Receiving Leads
```
1. Check webhook URL copied correctly
2. Verify field mapping matches your data
3. Test with sample payload from UI
4. Check firewall allows POST requests
5. Look for errors in activity logs
```

### Database Connection Fails
```
1. Verify connection string syntax
2. Test connection from database client
3. Ensure read permissions on table
4. Check for required column aliases (as name, as email)
5. Verify network can reach database
6. Check credentials are correct
```

### OAuth Token Expired
```
1. Auto-refresh should handle it
2. If not, disconnect and reconnect account
3. Check token expiration in platform settings
4. Verify app permissions still valid
```

### Leads Not Created
```
1. Check connector is ACTIVE
2. Verify field mapping complete
3. Check lead validation (needs name, email, or phone)
4. Review error in last_error column
5. Check business_id is correct
```

## Monitoring

### Check Connector Status
```typescript
const { connectors } = useConnectors()
connectors.forEach(c => {
  console.log(`${c.connector_name}: ${c.sync_count} syncs, Last: ${c.last_sync_at}`)
  if (c.last_error) console.log(`ERROR: ${c.last_error}`)
})
```

### View Activity Logs
```sql
SELECT * FROM connector_activity_logs
WHERE business_id = 'your-id'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Sync History
```sql
SELECT * FROM database_sync_logs
WHERE connector_id = 'connector-id'
ORDER BY created_at DESC
LIMIT 10;
```

## Best Practices

### Webhook Integration
- ✅ Use field mapping for consistency
- ✅ Test before deploying
- ✅ Monitor sync counts
- ✅ Set up alerts for errors
- ❌ Don't send duplicate leads manually

### Database Sync
- ✅ Use read-only credentials
- ✅ Limit query scope with WHERE clause
- ✅ Rotate passwords regularly
- ✅ Monitor sync duration
- ❌ Don't use INSERT/UPDATE/DELETE queries

### Social Integration
- ✅ Review data extraction settings
- ✅ Disconnect unused accounts
- ✅ Monitor rate limits
- ✅ Re-auth when permissions change
- ❌ Don't share access tokens

### IVR Setup
- ✅ Map all menu options
- ✅ Test with actual phone calls
- ✅ Monitor call metrics
- ✅ Review intent accuracy
- ❌ Don't change mappings mid-campaign

## Performance Tips

1. **Webhook**: Map only needed fields
2. **Database**: Use WHERE clause to limit results
3. **Social**: Schedule syncs during off-hours
4. **IVR**: Keep menu simple (max 4 options)

## Rate Limits

- Webhook: Unlimited (but recommended <100/min)
- Database: 1 sync per 5 minutes
- Social: Platform-specific (usually 450 req/15 min)
- IVR: Phone provider limits

## Support

- Full docs: `CONNECTORS_IMPLEMENTATION.md`
- Issue with specific connector? Check its component file
- Need to add new connector type? Look at existing implementation pattern

## File Locations

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
└── types/
    └── growth-platform.ts

supabase/functions/
├── connector-operations/index.ts
└── social-oauth/index.ts
```

---

**Need help?** Check the implementation guide or review the component source code.
