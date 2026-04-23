# Stripe Payment Integration

**Comprehensive payment processing system for invoice payments, transaction management, and financial analytics.**

> **Status**: Production-Ready | **Version**: 1.0.0 | **Created**: 2026-04-27

---

## Overview

This integration provides a complete Stripe payment solution with:

- **Secure Payments**: PCI-compliant card processing
- **Invoice Payments**: Direct invoice payment integration
- **Payment Links**: Shareable links with QR codes
- **Analytics**: Real-time payment metrics and reporting
- **Webhooks**: Automatic event processing and status updates
- **Components**: Ready-to-use React payment UI
- **Database**: Comprehensive transaction schema

---

## Quick Start

### 1. Install Dependencies

All required dependencies are already in your `package.json`:
```bash
npm install
# qrcode.react is already included
```

### 2. Set Up Stripe Account

```bash
# Go to https://stripe.com
# Get API keys from Dashboard → Developers → API Keys
```

### 3. Configure Environment

Create `.env.local`:
```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 4. Deploy Infrastructure

See `STRIPE_DEPLOYMENT_CHECKLIST.md` for detailed steps:
- Database migration
- Webhook function deployment
- Email template setup
- Component integration

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── stripe.ts              # Core Stripe API wrapper
│   │   └── stripe-invoice.ts      # Invoice-specific operations
│   └── config/
│       └── stripe.ts              # Configuration & helpers
└── business/
    └── components/
        ├── StripeCheckout.tsx     # Payment form
        ├── PaymentLinkGenerator.tsx # Shareable links & QR
        └── PaymentDashboard.tsx    # Analytics dashboard

supabase/
├── migrations/
│   └── 20260427_stripe_integration.sql  # Database schema
├── functions/
│   ├── stripe-webhook/            # Event webhook handler
│   └── process-payment/           # Payment processing
└── email-templates/
    ├── payment-received.html      # Success email
    └── payment-failed.html        # Failure email
```

---

## Key Components

### Payment Form
```typescript
import { StripeCheckout } from '@/business/components/StripeCheckout';

<StripeCheckout
  invoiceId="inv_123"
  amount={1000}
  currency="inr"
  businessName="Your Business"
  customerEmail="customer@example.com"
  onSuccess={(paymentId) => console.log('Paid:', paymentId)}
  onError={(error) => console.error('Failed:', error)}
/>
```

### Payment Link with QR Code
```typescript
import { PaymentLinkGenerator } from '@/business/components/PaymentLinkGenerator';

<PaymentLinkGenerator
  invoiceId="inv_123"
  amount={1000}
  businessName="Your Business"
  onLinkGenerated={(url) => {
    // Share the link with customer
  }}
/>
```

### Analytics Dashboard
```typescript
import { PaymentDashboard } from '@/business/components/PaymentDashboard';

<PaymentDashboard businessId="business_id" days={30} />
```

---

## API Reference

### Create Payment Intent
```typescript
import { createPaymentIntent } from '@/app/api/stripe';

const intent = await createPaymentIntent(1000, 'inr', {
  invoice_id: 'inv_123',
  customer_email: 'user@example.com'
});
// Returns: { id, client_secret, amount, currency, status }
```

### Generate Payment Link
```typescript
import { createPaymentLink } from '@/app/api/stripe';

const link = await createPaymentLink(
  'inv_123',        // invoiceId
  1000,             // amount
  'Invoice Payment', // description
  'inr'             // currency
);
// Returns: { id, url, active, created }
```

### Process Refund
```typescript
import { createRefund } from '@/app/api/stripe';

const refund = await createRefund(
  'pi_123abc',      // paymentIntentId
  500,              // amount (optional)
  'customer_request' // reason (optional)
);
// Returns: { id, amount, status }
```

### Get Analytics
```typescript
import { getBusinessPaymentAnalytics } from '@/app/api/stripe-invoice';

const analytics = await getBusinessPaymentAnalytics('business_id', 30);
// Returns: {
//   totalRevenue, totalTransactions, successfulTransactions,
//   failedTransactions, successRate, averageTransactionAmount,
//   totalFees, currency
// }
```

---

## Configuration

### Stripe Keys

| Environment | Public Key | Secret Key | Webhook Secret |
|------------|-----------|-----------|----------------|
| Development | pk_test_* | sk_test_* | whsec_test_* |
| Production | pk_live_* | sk_live_* | whsec_live_* |

### Amount Validation

- **Minimum**: ₹100 (INR)
- **Maximum**: ₹9,99,99,999 (INR)
- **Format**: Integer (in paisa)

### Supported Currencies

- INR (Indian Rupee) - Default
- USD (US Dollar)
- EUR (Euro)

---

## Testing

### Test Cards

| Card Type | Number | Status |
|-----------|--------|--------|
| Visa | 4242 4242 4242 4242 | Success |
| Mastercard | 5555 5555 5555 4444 | Success |
| Amex | 3782 822463 10005 | Success |
| Decline | 4000 0000 0000 0002 | Declined |
| 3D Secure | 4000 0025 0000 3155 | Requires auth |

**Expiry**: Any future date | **CVC**: Any 3-4 digits

### Testing Webhooks

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Listen for webhook events
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test event
stripe trigger payment_intent.succeeded
```

---

## Database Schema

### stripe_transactions
Core transaction records
```sql
SELECT * FROM stripe_transactions 
WHERE business_id = 'business_uuid'
ORDER BY created_at DESC;
```

### payment_intents
Payment intent tracking for retries
```sql
SELECT * FROM payment_intents
WHERE invoice_id = 'invoice_uuid'
AND status NOT IN ('succeeded', 'failed');
```

### payment_links
Shareable payment links
```sql
SELECT * FROM payment_links
WHERE invoice_id = 'invoice_uuid'
AND active = true;
```

### payment_analytics
Aggregated metrics
```sql
SELECT * FROM payment_analytics
WHERE business_id = 'business_uuid'
ORDER BY period_date DESC
LIMIT 30;
```

---

## Security

✅ **PCI Compliance**
- Card data never stored locally
- Stripe handles all tokenization
- Server-side operations use only IDs

✅ **Webhook Security**
- HMAC signature verification
- Event validation before processing
- Idempotent operations

✅ **Access Control**
- Row-level security policies
- Business-scoped data access
- Secure environment variables

---

## Monitoring

### Daily Checks
```sql
-- Failed transactions
SELECT * FROM stripe_transactions 
WHERE status = 'failed' 
ORDER BY created_at DESC LIMIT 10;

-- Daily revenue
SELECT DATE(created_at), COUNT(*), SUM(amount)
FROM stripe_transactions 
WHERE status = 'succeeded'
GROUP BY DATE(created_at);
```

### Webhook Logs
```bash
supabase functions logs stripe-webhook --tail
```

---

## Troubleshooting

### Common Issues

**"Missing Stripe Keys"**
→ Check `VITE_STRIPE_PUBLIC_KEY` in `.env.local`

**"Webhook verification failed"**
→ Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard

**"Payment intent not found"**
→ Check payment intent hasn't expired (15 min timeout)

**"Card declined"**
→ Use test card `4242 4242 4242 4242` in test mode

### Debug Mode

```typescript
try {
  const intent = await createPaymentIntent(amount, currency);
  console.log('Success:', intent);
} catch (error) {
  if (error instanceof StripeError) {
    console.error(`${error.code}: ${error.message}`);
  }
}
```

---

## Documentation

- **Integration Guide**: `STRIPE_INTEGRATION_GUIDE.md`
  - Complete setup instructions
  - API documentation
  - Database schema details
  - Testing procedures

- **Implementation Status**: `STRIPE_IMPLEMENTATION_STATUS.md`
  - Feature checklist
  - File inventory
  - Integration phases

- **Deployment Checklist**: `STRIPE_DEPLOYMENT_CHECKLIST.md`
  - Step-by-step deployment
  - Testing procedures
  - Monitoring setup
  - Rollback plan

---

## Production Checklist

- [ ] Stripe live account created
- [ ] Live API keys obtained
- [ ] Environment variables updated
- [ ] Database migrated
- [ ] Webhook functions deployed
- [ ] Email templates configured
- [ ] Components integrated
- [ ] End-to-end testing completed
- [ ] Monitoring setup verified
- [ ] Team trained

---

## Support & Resources

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Status**: https://status.stripe.com
- **Community**: https://discord.gg/stripe

---

## Version History

- **v1.0.0** (2026-04-27) - Production release
  - Core payment processing
  - Invoice integration
  - Analytics dashboard
  - Complete documentation

---

## Next Steps

1. Set up Stripe account and get API keys
2. Configure environment variables
3. Deploy database migration
4. Deploy webhook functions
5. Integrate components into invoice UI
6. Test with sample payments
7. Deploy to production
8. Monitor transactions

---

**Created**: 2026-04-27 | **Status**: Production-Ready | **Maintained By**: Engineering Team
