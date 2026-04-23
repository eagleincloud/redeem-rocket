/**
 * Stripe Configuration
 * Manages Stripe API keys and webhook settings
 * Production-ready PCI compliant configuration
 */

// ─── Environment Variables ────────────────────────────────────────────────────
export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
export const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY || '';
export const STRIPE_WEBHOOK_SECRET = import.meta.env.STRIPE_WEBHOOK_SECRET || '';

// ─── Stripe Configuration ─────────────────────────────────────────────────────
export const stripeConfig = {
  publicKey: STRIPE_PUBLIC_KEY,
  apiVersion: '2024-06-20',
  locale: 'en',
};

// ─── Payment Settings ─────────────────────────────────────────────────────────
export const paymentDefaults = {
  currency: 'inr', // Default to INR for India market
  currencies: ['inr', 'usd', 'eur'],
  paymentMethods: ['card', 'upi', 'netbanking'],

  // Payment intent timeout
  intentTimeout: 15 * 60 * 1000, // 15 minutes in milliseconds

  // Retry policy
  maxRetries: 3,
  retryDelayMs: 1000,
};

// ─── Webhook Settings ─────────────────────────────────────────────────────────
export const webhookSettings = {
  events: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'charge.refunded',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ],
  tolerance: 5 * 60, // 5 minutes tolerance for webhook processing
};

// ─── Fee Configuration ─────────────────────────────────────────────────────────
export const stripeFeesPercentage = {
  card: 2.9 + 0.3, // 2.9% + ₹30 per transaction (shown as percentage)
  upi: 0, // UPI typically free in India
  netbanking: 0, // Net banking typically free
};

// ─── Error Messages ──────────────────────────────────────────────────────────
export const stripeErrors = {
  MISSING_PUBLIC_KEY: 'Stripe public key not configured',
  MISSING_SECRET_KEY: 'Stripe secret key not configured',
  INVALID_AMOUNT: 'Invalid payment amount',
  PAYMENT_INTENT_FAILED: 'Payment processing failed',
  WEBHOOK_VERIFICATION_FAILED: 'Webhook signature verification failed',
  REFUND_FAILED: 'Refund processing failed',
  CUSTOMER_NOT_FOUND: 'Customer not found in Stripe',
};

// ─── Validation Helpers ──────────────────────────────────────────────────────
export function validateStripeKeys(): boolean {
  return !!(STRIPE_PUBLIC_KEY && STRIPE_PUBLIC_KEY.startsWith('pk_'));
}

export function validateSecretKey(): boolean {
  return !!(STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.startsWith('sk_'));
}

export function validateWebhookSecret(): boolean {
  return !!(STRIPE_WEBHOOK_SECRET && STRIPE_WEBHOOK_SECRET.startsWith('whsec_'));
}

// ─── Amount Validation ─────────────────────────────────────────────────────────
export function isValidAmount(amount: number, currency: string = 'inr'): boolean {
  const minAmount = currency.toLowerCase() === 'inr' ? 100 : 1; // ₹100 minimum
  const maxAmount = 999999999; // ₹9,99,99,999 maximum

  return amount >= minAmount && amount <= maxAmount && Number.isInteger(amount);
}

// ─── Amount Formatter ──────────────────────────────────────────────────────────
export function formatAmountForDisplay(
  amount: number,
  currency: string = 'inr',
): string {
  const divisor = currency.toLowerCase() === 'jpy' ? 1 : 100;
  const decimals = currency.toLowerCase() === 'jpy' ? 0 : 2;
  const value = (amount / divisor).toFixed(decimals);

  const currencySymbols: Record<string, string> = {
    inr: '₹',
    usd: '$',
    eur: '€',
  };

  const symbol = currencySymbols[currency.toLowerCase()] || currency.toUpperCase();
  return `${symbol}${value}`;
}

// ─── Amount Converter (for Stripe API) ─────────────────────────────────────────
export function convertAmountToStripe(amount: number, currency: string = 'inr'): number {
  const divisor = currency.toLowerCase() === 'jpy' ? 1 : 100;
  return Math.round(amount * divisor);
}

export function convertAmountFromStripe(amount: number, currency: string = 'inr'): number {
  const divisor = currency.toLowerCase() === 'jpy' ? 1 : 100;
  return Math.round(amount / divisor);
}
