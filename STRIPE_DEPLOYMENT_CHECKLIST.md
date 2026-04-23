# Stripe Payment Integration - Deployment Checklist

**Last Updated**: 2026-04-27

This checklist guides you through deploying the Stripe integration.

---

## Pre-Deployment Checklist

### Account Setup
- [ ] Create Stripe account at https://stripe.com
- [ ] Verify email address
- [ ] Complete business information
- [ ] Add payout method (bank account)
- [ ] Enable test mode

### API Keys & Secrets
- [ ] Copy Publishable Key (pk_test_...) from Stripe Dashboard
- [ ] Copy Secret Key (sk_test_...) from Stripe Dashboard
- [ ] Create Webhook Endpoint in Stripe Dashboard
- [ ] Copy Webhook Signing Secret (whsec_...)

---

## Environment Setup

### 1. Local Development

Create `.env.local` in project root:
```bash
# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### 2. Vercel Production Secrets

Add to Vercel project settings:
```
STRIPE_SECRET_KEY = sk_live_your_key_here
STRIPE_WEBHOOK_SECRET = whsec_live_your_secret_here
```

### 3. Test the Keys

```bash
# Test public key format
echo $VITE_STRIPE_PUBLIC_KEY
# Should output: pk_test_xxxxx... or pk_live_xxxxx...

# Verify .env loading
npm run dev
# Check console for key validation messages
```

---

## Database Migration

### 1. Create Migration File

Copy the SQL from `STRIPE_INTEGRATION_GUIDE.md` to:
```
supabase/migrations/20260427_stripe_integration.sql
```

### 2. Apply Migration

Using Supabase CLI:
```bash
# Authenticate if needed
supabase login

# Apply migration
supabase migration up

# Or manually through Supabase Dashboard
# SQL Editor → Paste SQL content → Run
```

### 3. Verify Tables Created

```sql
-- Test in Supabase SQL Editor
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'stripe_%' OR tablename LIKE 'payment_%';

-- Should show:
-- stripe_customers
-- stripe_transactions
-- invoice_payments
-- payment_intents
-- payment_links
-- stripe_settlements
-- payment_analytics
```

---

## Webhook Function Deployment

### 1. Create Webhook Function Directory

```bash
mkdir -p supabase/functions/stripe-webhook
```

### 2. Create Function File

Create `supabase/functions/stripe-webhook/index.ts` with webhook handler code from documentation.

### 3. Create deno.json (if needed)

```bash
touch supabase/functions/stripe-webhook/deno.json
```

With content:
```json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

### 4. Deploy Function

```bash
supabase functions deploy stripe-webhook
```

### 5. Get Function URL

```bash
supabase functions list

# Look for: stripe-webhook
# URL will be: https://<project>.supabase.co/functions/v1/stripe-webhook
```

### 6. Configure in Stripe Dashboard

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **Add Endpoint**
3. Paste Function URL from step 5
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy **Signing Secret** (starts with `whsec_`)
6. Update `STRIPE_WEBHOOK_SECRET` in environment

---

## Payment Processing Function Deployment

### 1. Create Function Directory

```bash
mkdir -p supabase/functions/process-payment
```

### 2. Create Function File

Create `supabase/functions/process-payment/index.ts` with payment processing code.

### 3. Deploy Function

```bash
supabase functions deploy process-payment
```

### 4. Verify Deployment

```bash
# Check function logs
supabase functions list

# Test endpoint
curl -X POST https://<project>.supabase.co/functions/v1/process-payment \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## Email Template Setup

### 1. Create Email Templates

Create files:
- `supabase/email-templates/payment-received.html`
- `supabase/email-templates/payment-failed.html`

Copy HTML content from documentation.

### 2. Configure Email Sending

If using Resend or similar:
```typescript
// In webhook handler
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

await resend.emails.send({
  from: "payments@yourdomain.com",
  to: customerEmail,
  subject: "Payment Received",
  html: paymentReceivedTemplate,
});
```

---

## Component Integration

### 1. Add Components to Invoice Page

```typescript
import { StripeCheckout } from '@/business/components/StripeCheckout';
import { PaymentLinkGenerator } from '@/business/components/PaymentLinkGenerator';
import { PaymentDashboard } from '@/business/components/PaymentDashboard';

export function InvoiceDetail({ invoiceId, businessId }) {
  return (
    <div>
      {/* Existing invoice details */}

      {/* Payment Options */}
      <h3>Payment</h3>
      
      {/* Option 1: Direct checkout */}
      <StripeCheckout
        invoiceId={invoiceId}
        amount={invoice.amount}
        businessName={businessName}
        customerEmail={customerEmail}
        onSuccess={(paymentId) => {
          // Refresh invoice status
        }}
      />

      {/* Option 2: Shareable link */}
      <PaymentLinkGenerator
        invoiceId={invoiceId}
        amount={invoice.amount}
        businessName={businessName}
      />

      {/* Analytics Dashboard */}
      <PaymentDashboard businessId={businessId} />
    </div>
  );
}
```

### 2. Update Invoice Status on Payment

```typescript
// In invoice page, after payment success
useEffect(() => {
  const checkPaymentStatus = async () => {
    const status = await checkInvoicePaymentStatus(invoiceId);
    if (status?.status === 'succeeded') {
      // Update invoice UI
      setInvoice(prev => ({ ...prev, status: 'paid' }));
      // Show success message
      toast.success('Payment received! Invoice marked as paid.');
    }
  };

  const interval = setInterval(checkPaymentStatus, 5000); // Poll every 5 seconds
  return () => clearInterval(interval);
}, [invoiceId]);
```

---

## Testing Checklist

### Local Testing

- [ ] Run `npm run dev`
- [ ] Navigate to invoice payment page
- [ ] Test with Stripe test card: `4242 4242 4242 4242`
- [ ] Verify payment success in Stripe Dashboard
- [ ] Check database for transaction record
- [ ] Test payment failure with: `4000 0000 0000 0002`
- [ ] Test QR code generation
- [ ] Test payment link sharing

### Webhook Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Start webhook forwarding
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# In another terminal, trigger test event
stripe trigger payment_intent.succeeded

# Check Supabase logs for webhook receipt
supabase functions logs stripe-webhook
```

### Staging Testing

- [ ] Deploy to staging environment
- [ ] Test end-to-end with real API calls
- [ ] Verify webhook delivery
- [ ] Check email sending
- [ ] Monitor logs for errors
- [ ] Test refund flow

### Production Testing

- [ ] Switch to live Stripe keys
- [ ] Process 1-2 test transactions with real card
- [ ] Verify settlement setup
- [ ] Monitor first 50 transactions
- [ ] Check webhook logs daily for first week

---

## Monitoring Setup

### Daily Checks (First Month)

1. **Stripe Dashboard**
   - Check for payment failures
   - Review webhook logs
   - Verify settlements

2. **Supabase**
   ```sql
   -- Check failed transactions
   SELECT * FROM stripe_transactions 
   WHERE status = 'failed' 
   ORDER BY created_at DESC 
   LIMIT 10;

   -- Check daily revenue
   SELECT 
     DATE(created_at) as day,
     COUNT(*) as transactions,
     SUM(amount) as revenue,
     AVG(amount) as avg_amount
   FROM stripe_transactions
   WHERE status = 'succeeded'
   GROUP BY DATE(created_at)
   ORDER BY day DESC;
   ```

3. **Logs**
   ```bash
   # Check webhook function logs
   supabase functions logs stripe-webhook --tail

   # Check payment processing logs
   supabase functions logs process-payment --tail
   ```

### Weekly Reports

```sql
-- Weekly analytics
SELECT 
  DATE(created_at) as date,
  COUNT(*) as transactions,
  SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as successful,
  SUM(amount) as total_amount,
  SUM(stripe_fee) as total_fees,
  ROUND(
    100.0 * COUNT(CASE WHEN status = 'succeeded' THEN 1) / COUNT(*),
    2
  ) as success_rate
FROM stripe_transactions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Production Deployment

### Step 1: Switch to Live Keys

```bash
# Get live keys from Stripe Dashboard
# Go to: Developers → API Keys → Live data toggle

# Update environment variables
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx
```

### Step 2: Update Webhook

1. Remove test webhook endpoint from Stripe
2. Add new live endpoint: `https://yourdomain.com/functions/v1/stripe-webhook`
3. Copy new signing secret
4. Update `STRIPE_WEBHOOK_SECRET` in production

### Step 3: Deploy to Production

```bash
# Build and deploy
npm run build:business
vercel deploy --prod

# Verify deployment
# Test payment flow on live site
```

### Step 4: Monitor Closely

- Monitor all transactions for first 48 hours
- Check Stripe dashboard daily
- Review webhook delivery logs
- Watch for error spikes
- Verify settlements

---

## Rollback Plan

If issues occur after production deployment:

1. **Disable Payment Processing**
   ```bash
   # Disable in environment or add feature flag
   # Show message: "Payments temporarily unavailable"
   ```

2. **Revert to Previous Version**
   ```bash
   # If needed, deploy previous working version
   vercel deploy --prod --remove-missing
   ```

3. **Investigate Root Cause**
   - Check Supabase logs
   - Review webhook deliveries
   - Check Stripe API status
   - Review recent code changes

4. **Fix and Redeploy**
   - Fix identified issues
   - Test thoroughly in staging
   - Deploy to production

---

## Common Issues & Solutions

### "Missing Stripe Keys"
→ Verify environment variables are set correctly

### "Webhook Signature Verification Failed"
→ Confirm STRIPE_WEBHOOK_SECRET matches Stripe Dashboard

### "Payment Intent Not Found"
→ Check if payment intent has expired (15 min timeout)

### "Card Declined"
→ Use test card `4242 4242 4242 4242` in test mode

### "Database Connection Failed"
→ Verify Supabase credentials and RLS policies

---

## Support Contacts

- **Stripe Support**: https://support.stripe.com
- **Supabase Community**: https://discord.gg/supabase
- **Documentation**: See STRIPE_INTEGRATION_GUIDE.md

---

## Sign-Off Checklist

- [ ] All files created and deployed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Webhook functions deployed
- [ ] Components integrated into UI
- [ ] Local testing completed
- [ ] Staging testing completed
- [ ] Production deployment completed
- [ ] Monitoring setup verified
- [ ] Team trained on payment flows
- [ ] Documentation reviewed and understood

**Deployment Complete**: _______________  
**Deployed By**: _______________  
**Date**: _______________
