# Finance & Payments Module - Requirements & Dependencies

## System Requirements

### Backend Infrastructure
- **Supabase:** v2.x or later
  - PostgreSQL 13+ (included with Supabase)
  - PostgREST API
  - Realtime features (optional, for live updates)
  - Edge Functions with Deno runtime

- **Stripe Account:** (Required for payment processing)
  - API Keys (Publishable & Secret)
  - Webhook signing secret

### Development Environment
- **Node.js:** 18.x or later (for local development)
- **TypeScript:** 5.x or later
- **Deno:** 1.40+ (for local Edge Function testing)
- **Database Client:** psql or pgAdmin for direct database access (optional)

---

## Software Dependencies

### Frontend/Application
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "@stripe/stripe-js": "^1.54.0",
  "typescript": "^5.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

### Edge Functions (Deno)
- No external dependencies beyond Deno standard library
- Uses esm.sh for dependency imports:
  - `@supabase/supabase-js@2` (remote)

### Development Tools (Optional)
- Supabase CLI: `npm install -g supabase`
- Stripe CLI: `brew install stripe/stripe-cli/stripe` (macOS)
- PostgreSQL tools: `psql`, `pgAdmin`

---

## Database Requirements

### Tables Required (Auto-Created by Migrations)

#### Finance Module
- `invoices` - Core invoice records
- `invoice_items` - Line items
- `expenses` - Operating expenses
- `financial_summaries` - Aggregated financial data
- `finance_activities` - Audit log

#### Payments Module
- `stripe_customers` - Stripe customer mapping
- `payment_methods` - Saved payment methods
- `transactions` - Payment transactions
- `invoice_payments` - Invoice-payment linking
- `refunds` - Refund records
- `payment_audit_logs` - Payment audit trail

#### Inventory Module
- `inventory_items` - Product definitions
- `inventory_movements` - Stock changes
- `inventory_valuations` - Inventory snapshots
- `inventory_audit_logs` - Inventory audit trail

### Database Functions Required
- `set_updated_at()` - Auto-update timestamps (must exist from earlier migrations)
- `update_financial_summary_on_invoice_change()` - Financial calculation trigger
- `update_invoice_status_on_payment()` - Status update trigger
- `sync_invoice_paid_amount()` - Payment synchronization trigger
- `update_transaction_on_refund()` - Refund status trigger
- `update_inventory_on_movement()` - Stock quantity update trigger
- `calculate_inventory_total_value()` - Inventory valuation function
- `get_low_stock_items()` - Low stock alert function

### Database Constraints & Indexes

**Indexes Created by Migrations:**
- All tables indexed on `business_id` (primary access pattern)
- Composite indexes on `business_id` + `status` for filtering
- Date-based indexes for range queries
- Unique constraints on invoice_number, SKU, payment_method combinations

**Constraints:**
- Foreign key relationships with CASCADE delete where appropriate
- CHECK constraints on amounts (must be > 0)
- CHECK constraints on status values (enums)
- UNIQUE constraints on multi-tenant identifiers

---

## External Services

### Stripe
**Required for Payment Processing:**
- Stripe Account with API access
- API Keys:
  - Publishable key (pk_test_* or pk_live_*)
  - Secret key (sk_test_* or sk_live_*) - **NEVER share**
  - Webhook signing secret (whsec_*)

**Stripe Features Used:**
- Customers API
- Payment Methods API
- Payment Intents API
- Charges API
- Refunds API
- Webhooks

**Webhook Events Required:**
- `charge.succeeded` - Payment completed
- `charge.failed` - Payment declined
- `charge.refunded` - Refund processed
- `customer.created` - New customer
- `customer.updated` - Customer updated

### Email Service (Optional)
For sending invoices and reminders:
- Resend (configured in project via `send-verification-email` function pattern)
- SendGrid
- Mailgun
- AWS SES

---

## Environment Variables

### Required in `.env.local` (Frontend)
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
```

### Required in Supabase (Edge Functions)
```bash
# Set via: supabase secrets set KEY VALUE

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (service role)
STRIPE_SECRET_KEY=sk_test_... or sk_live_... (if webhook handling)
STRIPE_WEBHOOK_SECRET=whsec_... (if webhook handling)
```

### Optional Environment Variables
```bash
# For production deployment
ENVIRONMENT=production
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
```

---

## Browser Compatibility

### Minimum Supported Versions
- Chrome/Edge: v90+
- Firefox: v88+
- Safari: v14+
- Mobile: iOS Safari 14+, Chrome Mobile 90+

### Required Features
- ES2020+ JavaScript support
- Fetch API
- localStorage
- Promises/async-await

---

## API Compatibility

### Supabase
- API version: Stable (no specific version locking needed)
- PostgREST: v11+
- JWT authentication support
- Real-time subscriptions support (optional)

### Stripe
- API version: 2023-10-16 or later recommended
- HTTPS required
- Webhook signature verification required

---

## Performance Requirements

### Database
- **Connection Pool:** Minimum 20-30 connections
- **Query Response Time:** < 200ms for standard queries
- **Storage:** Recommend minimum 10GB for production
- **Backup:** Automated daily backups

### Edge Functions
- **Cold Start Time:** < 5 seconds
- **Execution Time:** < 60 seconds per request
- **Memory:** 1GB available per function
- **Concurrency:** 1000+ concurrent requests (platform limit)

### Application
- **Minimum RAM:** 512MB
- **Network:** Minimum 1Mbps for production use
- **CPU:** Single core sufficient (server-side)

---

## Compliance & Security

### Data Protection
- GDPR compliance ready (audit logs, soft deletes)
- CCPA support (all customer data accessible for export)
- Payment Card Industry Data Security Standard (PCI DSS):
  - Never handle raw credit card data (delegated to Stripe)
  - No card data stored in database
  - Secure transmission of payment methods

### Audit & Compliance
- Audit trails on all financial transactions
- Immutable transaction records
- Role-based access control via business_team_members
- Encrypted payment method storage via Stripe

### Encryption
- All data in transit: HTTPS/TLS
- Database connections: SSL/TLS
- Environment variables: Encrypted in Supabase vault
- Payment method IDs: Stored as Stripe references (not card data)

---

## Testing Requirements

### Unit Testing
- Jest or Vitest for TypeScript functions
- Mock Supabase client for isolated tests

### Integration Testing
- Real Supabase project (staging database)
- Stripe test/sandbox mode API keys
- Test data fixtures for invoices, transactions

### End-to-End Testing
- Playwright or Cypress for UI flows
- Staging environment with real Supabase
- Test Stripe payment flows

---

## Deployment Requirements

### Pre-Deployment
- [ ] All migrations reviewed and tested locally
- [ ] Edge Functions deployed to staging
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] RLS policies configured (if using)
- [ ] Stripe webhook endpoints configured
- [ ] SSL certificates valid
- [ ] DNS records updated

### Production Checklist
- [ ] Database auto-backups enabled
- [ ] Monitoring and alerting configured
- [ ] Error logging service active
- [ ] Rate limiting configured
- [ ] CORS policies set correctly
- [ ] WAF rules in place (if applicable)
- [ ] Incident response plan prepared

---

## Scaling Considerations

### For 100+ Invoices/Month
- Enable query caching for financial_summaries
- Use partial indexes (already included)
- Monitor slow queries regularly

### For 1000+ Customers
- Implement customer pagination
- Consider read replicas for reports
- Archive old transactions (> 7 years)

### For High Transaction Volume
- Enable Edge Function caching headers
- Use connection pooling in Supabase
- Consider denormalization for summaries (already done)

---

## Backup & Recovery

### Backup Strategy
- **Frequency:** Daily (Supabase default)
- **Retention:** Minimum 7 days, recommend 30 days
- **Location:** Geographic redundancy (Supabase handles)

### Recovery Procedures
- Point-in-time recovery: 7-30 days depending on plan
- Manual restore via Supabase Dashboard
- Test recovery procedures quarterly

---

## Monitoring Requirements

### Key Metrics to Monitor
- Invoice creation rate
- Payment success rate
- Edge Function response times
- Database query performance
- Error rates
- RLS policy violations

### Alerting Thresholds
- Error rate > 1%
- Response time > 5 seconds
- Database CPU > 80%
- Failed payments > 5 in 1 hour

---

## Documentation Requirements

All deployment must include:
1. Updated entity-relationship diagram
2. API endpoint documentation
3. Edge Function deployment guide
4. RLS policy documentation
5. Data backup/restore procedures
6. Incident response playbook

---

## Known Limitations

### Current Version (2026-04-24)
- No support for multi-currency invoicing (single currency per business)
- Payment methods tied to Stripe (no direct bank transfers without webhooks)
- Inventory movements do not support fractional units by default
- Financial summaries calculated at month level (pre-calculated)

### Planned Enhancements
- Multi-currency support
- Payment plan/subscription support
- Batch invoice generation
- Advanced reporting with custom date ranges
- Inventory forecasting

---

## Migration Path

### From Existing System
- Backward compatibility maintained via nullable fields
- Old data can be imported via bulk inserts
- Schema supports parallel running of old and new systems
- Soft migration available (gradually move data)

### Upgrade Path
- Migrations are additive (no destructive changes planned)
- New features added via new tables
- Old tables kept for historical data
- Version management via migration timestamps

---

## Support & Resources

### Documentation
- `FINANCE_PAYMENTS_SCHEMA.md` - Database design
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- `IMPLEMENTATION_EXAMPLES.md` - Code examples

### External Resources
- Supabase Docs: https://supabase.com/docs
- Stripe API Docs: https://stripe.com/docs/api
- PostgreSQL Docs: https://www.postgresql.org/docs/

### Community
- Supabase Discord: https://discord.supabase.com
- Stripe Support: https://support.stripe.com

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-04-24 | 1.0.0 | Initial release with Finance, Payments, Inventory modules |

---

## Checklist: Before Deployment

- [ ] Read through all 4 documentation files
- [ ] Review schema design against business requirements
- [ ] Set up staging Supabase project
- [ ] Configure all environment variables
- [ ] Deploy migrations to staging
- [ ] Deploy Edge Functions to staging
- [ ] Test all API wrapper functions
- [ ] Verify Stripe integration (sandbox mode)
- [ ] Set up webhook handling
- [ ] Configure monitoring and alerts
- [ ] Perform security audit
- [ ] Load test with 1000+ records
- [ ] User acceptance testing
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window
- [ ] Deploy to production
- [ ] Monitor closely for 24-48 hours
- [ ] Document any issues or customizations

---

**Last Updated:** April 24, 2026  
**Maintained By:** Development Team  
**Contact:** [Your Contact Info]
