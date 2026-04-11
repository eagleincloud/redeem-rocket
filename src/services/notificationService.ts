/**
 * Notification Service — Email · SMS · WhatsApp · In-App · Push (FCM)
 *
 * External channels:
 *  • MSG91       — SMS, WhatsApp, Email (VITE_MSG91_API_KEY)
 *  • Firebase FCM — Push notifications via fcm-send edge function
 *
 * Optional env vars:
 *   VITE_MSG91_SENDER_ID     — Registered SMS sender ID
 *   VITE_MSG91_WA_NUMBER     — Connected WhatsApp Business number
 *   VITE_MSG91_EMAIL_FROM    — Verified sending email
 *   VITE_FIREBASE_*          — Firebase config (for FCM push)
 */

import { supabase } from '@/app/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotifChannel = 'email' | 'sms' | 'whatsapp' | 'in_app' | 'push';

export type NotifEventType =
  | 'payment_submitted'
  | 'payment_acknowledged'
  | 'payment_approved'
  | 'payment_rejected'
  | 'cashback_earned'
  | 'new_payment_received'    // business side: new submission
  | 'order_placed'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'new_order_received'      // business side
  | 'offer_nearby'
  | 'campaign_sent'
  | 'account_created'
  | 'login_alert'
  | 'claim_invitation'        // scraped business: your listing is live, claim it
  | 'lead_follow_up_reminder' // business: follow-up due for a lead
  | 'lead_stage_changed'      // business: lead moved to new stage
  | 'lead_created'
  | 'lead_activity_logged'
  | 'lead_follow_up_scheduled'
  | 'lead_follow_up_completed'
  | 'lead_won'
  | 'lead_lost';

export interface NotifRecipient {
  name: string;
  email?: string;
  phone?: string;  // 10-digit Indian mobile number, without +91
}

export interface NotifPayload {
  type: NotifEventType;
  recipient: NotifRecipient;
  recipientType: 'customer' | 'business';
  userId?: string;             // DB user_id for in-app notification row
  data: {
    amount?: number;
    businessName?: string;
    customerName?: string;
    method?: string;
    cashback?: number;
    status?: string;
    submissionId?: string;
    orderId?: string;
    offerTitle?: string;
    [key: string]: unknown;
  };
  channels?: NotifChannel[];   // defaults to all configured channels
}

interface SendResult {
  channel: NotifChannel;
  success: boolean;
  error?: string;
}

// ── Message Templates ─────────────────────────────────────────────────────────

interface MsgTemplate { subject: string; body: string }

function buildMessage(
  type: NotifEventType,
  data: NotifPayload['data'],
  recipientName: string,
  channel: NotifChannel,
): MsgTemplate {
  const amt  = data.amount    ? `₹${Number(data.amount).toLocaleString('en-IN')}` : '';
  const biz  = data.businessName  ?? 'the store';
  const cust = data.customerName  ?? 'Customer';
  const meth = data.method === 'upi' ? 'UPI' : data.method === 'cash' ? 'Cash' : (data.method ?? 'UPI');
  const cb   = data.cashback  ? `₹${Number(data.cashback).toFixed(0)}` : '';
  const ref  = data.submissionId ? ` (Ref: #${String(data.submissionId).slice(0, 8)})` : '';
  const isShort = channel === 'sms'; // SMS messages should be shorter

  const tpl: Record<NotifEventType, MsgTemplate> = {
    payment_submitted: {
      subject: `Payment Submitted at ${biz}`,
      body: isShort
        ? `Hi ${recipientName}! Your payment of ${amt} at ${biz} is submitted.${ref} Cashback: ${cb || 'pending'}. -Redeem Rocket`
        : `Hi ${recipientName}! 🎉\n\nYour payment of ${amt} at *${biz}* has been submitted successfully.\n\n📋 *Details:*\n• Amount: ${amt}\n• Method: ${meth}\n• Est. Cashback: ${cb || 'Pending approval'}${ref}\n\nWe'll notify you once the business confirms your payment. Track your cashback in the app! 🚀\n\n- Redeem Rocket`,
    },
    payment_acknowledged: {
      subject: `Payment Acknowledged by ${biz}`,
      body: isShort
        ? `Hi ${recipientName}! ${biz} acknowledged your ${amt} payment. Cashback: ${cb || 'being processed'}. -Redeem Rocket`
        : `Hi ${recipientName}! ✅\n\n*${biz}* has acknowledged your payment of ${amt}.\n\nYour cashback of *${cb || 'pending'}* is being processed. You'll receive it once fully approved!\n\n- Redeem Rocket`,
    },
    payment_approved: {
      subject: `🎉 Payment Approved! ${cb} Cashback Credited`,
      body: isShort
        ? `Congrats ${recipientName}! Your ${amt} payment at ${biz} is APPROVED. ${cb} cashback credited! -Redeem Rocket`
        : `🎉 Congratulations ${recipientName}!\n\nYour payment of ${amt} at *${biz}* has been *APPROVED!*\n\n💰 *${cb} cashback* has been credited to your Redeem Rocket wallet!\n\nKeep shopping to earn more rewards. 🚀\n\n- Redeem Rocket`,
    },
    payment_rejected: {
      subject: `Payment Submission Update`,
      body: isShort
        ? `Hi ${recipientName}, your ${amt} payment at ${biz} was not approved. Please contact the store. -Redeem Rocket`
        : `Hi ${recipientName},\n\nWe're sorry to inform you that your payment of ${amt} at *${biz}* could not be approved at this time.\n\nPlease contact the store directly for more information. You can re-submit with a clearer bill photo.\n\n- Redeem Rocket`,
    },
    cashback_earned: {
      subject: `💰 ${cb} Cashback Credited!`,
      body: isShort
        ? `Hi ${recipientName}! ${cb} cashback from ${biz} credited to your wallet! -Redeem Rocket`
        : `Hi ${recipientName}! 💰\n\n*${cb} cashback* from ${biz} has been credited to your Redeem Rocket wallet!\n\nOpen the app to view your wallet balance and redeem rewards. 🚀\n\n- Redeem Rocket`,
    },
    new_payment_received: {
      subject: `New Payment: ${amt} from ${cust}`,
      body: isShort
        ? `New payment! ${cust} paid ${amt} via ${meth}. Open Invoices to acknowledge. -Redeem Rocket`
        : `💳 *New Payment Received!*\n\n*${cust}* paid *${amt}* via ${meth} at your store.${ref}\n\n✅ Open the *Invoices* section in your Redeem Rocket dashboard to acknowledge and approve.\n\n- Redeem Rocket`,
    },
    order_placed: {
      subject: `Order Confirmed - ${biz}`,
      body: isShort
        ? `Hi ${recipientName}! Your order at ${biz} is confirmed. Amount: ${amt}. -Redeem Rocket`
        : `Hi ${recipientName}! 🛍️\n\nYour order at *${biz}* has been confirmed!\n\nAmount: ${amt}\n\nYou'll receive updates as your order is processed. Track in the app. 🚀\n\n- Redeem Rocket`,
    },
    order_confirmed: {
      subject: `Order Processing - ${biz}`,
      body: isShort
        ? `Hi ${recipientName}! ${biz} is processing your order of ${amt}. -Redeem Rocket`
        : `Hi ${recipientName}! ✅\n\n*${biz}* is now processing your order of ${amt}.\n\nExpected to be ready soon. Stay tuned for updates!\n\n- Redeem Rocket`,
    },
    order_shipped: {
      subject: `Order Shipped from ${biz}`,
      body: isShort
        ? `Hi ${recipientName}! Your ${amt} order from ${biz} is on the way! -Redeem Rocket`
        : `Hi ${recipientName}! 🚚\n\nYour order of ${amt} from *${biz}* is on its way!\n\n- Redeem Rocket`,
    },
    order_delivered: {
      subject: `Order Delivered! ⭐ Rate your experience`,
      body: isShort
        ? `Hi ${recipientName}! Your order from ${biz} was delivered! Rate your experience in the app. -Redeem Rocket`
        : `Hi ${recipientName}! 🎉\n\nYour order from *${biz}* has been delivered!\n\nPlease rate your experience in the app to help others. ⭐\n\n- Redeem Rocket`,
    },
    new_order_received: {
      subject: `New Order Received - ${amt}`,
      body: isShort
        ? `New order! ${cust} placed an order of ${amt}. Check Orders. -Redeem Rocket`
        : `🛍️ *New Order Received!*\n\n*${cust}* placed an order of *${amt}*.\n\nOpen your *Orders* dashboard to confirm and process.\n\n- Redeem Rocket`,
    },
    offer_nearby: {
      subject: `Special Offer Near You!`,
      body: isShort
        ? `Hi ${recipientName}! ${biz} has a special offer: ${data.offerTitle ?? 'Check it out'}. Open app! -Redeem Rocket`
        : `Hi ${recipientName}! 📍\n\nYou're near *${biz}* which has a special offer:\n\n🏷️ *${data.offerTitle ?? 'Special Deal'}*\n\nOpen Redeem Rocket to claim it before it expires!\n\n- Redeem Rocket`,
    },
    campaign_sent: {
      subject: `Message from ${biz}`,
      body: isShort
        ? `Hi ${recipientName}! ${biz} sent you a message. Open Redeem Rocket for details. -Redeem Rocket`
        : `Hi ${recipientName}! 👋\n\n*${biz}* has a message for you.\n\nOpen Redeem Rocket to view the full details and any special offers.\n\n- Redeem Rocket`,
    },
    account_created: {
      subject: `Welcome to Redeem Rocket! 🚀`,
      body: isShort
        ? `Welcome ${recipientName}! Your Redeem Rocket account is ready. Start earning cashback today! -Redeem Rocket`
        : `Welcome to Redeem Rocket, ${recipientName}! 🚀\n\nYour account is all set. Start discovering local businesses and earning cashback on every purchase!\n\n- Redeem Rocket`,
    },
    login_alert: {
      subject: `New Login to Your Account`,
      body: isShort
        ? `Hi ${recipientName}, a new login was detected on your Redeem Rocket account. Not you? Contact support. -Redeem Rocket`
        : `Hi ${recipientName},\n\nA new login was detected on your Redeem Rocket account.\n\nIf this wasn't you, please contact support immediately.\n\n- Redeem Rocket`,
    },
    claim_invitation: {
      subject: `Your business is listed on Redeem Rocket!`,
      body: isShort
        ? `Hi ${recipientName}! Your business is on Redeem Rocket 🚀 Claim your free listing: ${data.claimUrl ?? ''} -Redeem Rocket`
        : `Hi ${recipientName},\n\nGreat news! Your business is already listed on Redeem Rocket and customers near you are discovering it.\n\nClaim your free profile to:\n✅ Add your own offers & discounts\n✅ Get notified when customers visit\n✅ Accept orders directly\n\n👉 Claim here (free): ${data.claimUrl ?? ''}\n\n— Redeem Rocket Team`,
    },
    lead_follow_up_reminder: {
      subject: `Follow-up Due: ${data.leadName ?? 'Lead'}`,
      body: isShort
        ? `Follow-up due with ${data.leadName ?? 'Lead'}: ${data.followUpTitle ?? ''}. Open Leads. -Redeem Rocket`
        : `Hi ${recipientName}! 📋\n\nYou have a follow-up due:\n\n*Lead:* ${data.leadName ?? 'Lead'}\n*Task:* ${data.followUpTitle ?? 'Follow-up'}\n\nOpen your Leads dashboard to take action before it goes cold.\n\n— Redeem Rocket`,
    },
    lead_stage_changed: {
      subject: `Lead Update: ${data.leadName ?? 'Lead'} → ${data.newStage ?? ''}`,
      body: isShort
        ? `Lead ${data.leadName ?? ''} moved to ${data.newStage ?? ''}. -Redeem Rocket`
        : `Hi ${recipientName}! 🎯\n\nLead *${data.leadName ?? 'Lead'}* has been moved to *${data.newStage ?? 'new stage'}*.\n\nOpen Leads to continue your pipeline.\n\n— Redeem Rocket`,
    },
    lead_created: {
      subject: `New lead: ${data.leadName ?? 'Lead'}`,
      body: isShort
        ? `New lead: ${data.leadName ?? 'Lead'}. Stage: ${data.stage ?? 'New'}. -Redeem Rocket`
        : `New lead added: *${data.leadName ?? 'Lead'}*${data.company ? ` (${data.company})` : ''}. Deal value: ₹${data.dealValue ?? 0}. Assigned stage: ${data.stage ?? 'New'}.`,
    },
    lead_activity_logged: {
      subject: `Activity on ${data.leadName ?? 'Lead'}`,
      body: isShort
        ? `Activity on ${data.leadName ?? 'Lead'}: ${data.activityTitle ?? ''}. -Redeem Rocket`
        : `Activity logged on *${data.leadName ?? 'Lead'}*: ${data.activityTitle ?? ''}. ${data.activityBody ? `Note: ${data.activityBody}` : ''}`,
    },
    lead_follow_up_scheduled: {
      subject: `Follow-up scheduled: ${data.leadName ?? 'Lead'}`,
      body: isShort
        ? `Follow-up for ${data.leadName ?? 'Lead'}: ${data.followUpTitle ?? ''} due ${data.dueAt ?? ''}. -Redeem Rocket`
        : `Follow-up scheduled for *${data.leadName ?? 'Lead'}*: "${data.followUpTitle ?? ''}" due ${data.dueAt ?? ''}.`,
    },
    lead_follow_up_completed: {
      subject: `Follow-up done: ${data.leadName ?? 'Lead'}`,
      body: isShort
        ? `Follow-up done: ${data.leadName ?? 'Lead'} — ${data.followUpTitle ?? ''}. -Redeem Rocket`
        : `Follow-up completed for *${data.leadName ?? 'Lead'}*: "${data.followUpTitle ?? ''}".`,
    },
    lead_won: {
      subject: `🏆 Lead Won: ${data.leadName ?? 'Lead'}!`,
      body: isShort
        ? `Won: ${data.leadName ?? 'Lead'}! Value: ₹${data.closedValue ?? 0}. -Redeem Rocket`
        : `*${data.leadName ?? 'Lead'}* has been marked as Won! Deal value: ₹${data.closedValue ?? data.dealValue ?? 0}. 🎉`,
    },
    lead_lost: {
      subject: `Lead Lost: ${data.leadName ?? 'Lead'}`,
      body: isShort
        ? `Lost: ${data.leadName ?? 'Lead'}. Reason: ${data.lostReason ?? 'N/A'}. -Redeem Rocket`
        : `*${data.leadName ?? 'Lead'}* has been marked as Lost. Reason: ${data.lostReason ?? 'Not specified'}.`,
    },
  };

  return tpl[type] ?? { subject: 'Notification from Redeem Rocket', body: `Hi ${recipientName}, you have a new notification from Redeem Rocket.` };
}

// ── Channel Senders (all powered by MSG91) ────────────────────────────────────

const MSG91_KEY = () => import.meta.env.VITE_MSG91_API_KEY as string | undefined;

/** Normalise any phone string to 10 Indian digits */
function normalisePhone(phone: string): string {
  return phone.replace(/^\+?91/, '').replace(/\D/g, '').slice(-10);
}

/**
 * Transactional SMS via MSG91.
 * Uses the "direct" route (route=4) for transactional messages.
 * Falls back to a console log when the API key is not set.
 */
async function sendEmail(to: string, _recipientName: string, subject: string, body: string): Promise<boolean> {
  const key  = MSG91_KEY();
  const from = import.meta.env.VITE_MSG91_EMAIL_FROM as string | undefined;

  if (!key || !from) {
    console.info('[notify:email] MSG91 email not configured — skipping email to', to);
    return false;
  }

  const domain = from.split('@')[1] ?? '';
  try {
    const res = await fetch('https://api.msg91.com/api/v5/email/send', {
      method: 'POST',
      headers: { Authkey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to:          [{ email: to }],
        from:        { email: from, name: 'Redeem Rocket' },
        domain,
        subject,
        body:        body.replace(/\*/g, '').replace(/\n/g, '<br>'),
        mail_type_id: '1',
      }),
    });
    const json = await res.json().catch(() => ({}));
    const ok = res.ok && json.message !== 'error';
    if (!ok) console.warn('[notify:email] MSG91 response:', json);
    return ok;
  } catch (e) {
    console.warn('[notify:email] send failed', e);
    return false;
  }
}

/**
 * Transactional SMS via MSG91.
 * Uses route 4 (transactional) with the registered sender ID.
 */
async function sendSMS(phone: string, body: string): Promise<boolean> {
  const key = MSG91_KEY();
  const normalised = normalisePhone(phone);
  if (normalised.length !== 10) return false;

  if (!key) {
    console.info('[notify:sms] MSG91 not configured — skipping SMS to', normalised);
    return false;
  }

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: { authkey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:  import.meta.env.VITE_MSG91_SENDER_ID || 'MGSMS',
        route:   '4',
        country: '91',
        sms: [{ message: body, to: [`91${normalised}`] }],
      }),
    });
    const json = await res.json().catch(() => ({}));
    const ok = json.type === 'success' || json.return === true;
    if (!ok) console.warn('[notify:sms] MSG91 response:', json);
    return ok;
  } catch (e) {
    console.warn('[notify:sms] send failed', e);
    return false;
  }
}

/**
 * WhatsApp message via MSG91.
 * Requires a connected WhatsApp Business number (VITE_MSG91_WA_NUMBER).
 * Falls back to a wa.me deep-link when not configured.
 */
async function sendWhatsApp(phone: string, body: string): Promise<boolean> {
  const key      = MSG91_KEY();
  const waNumber = import.meta.env.VITE_MSG91_WA_NUMBER as string | undefined;
  const normalised = normalisePhone(phone);
  if (normalised.length !== 10) return false;

  // If MSG91 WhatsApp is configured, use the API
  if (key && waNumber) {
    try {
      const res = await fetch(
        'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
        {
          method: 'POST',
          headers: { Authkey: key, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            integrated_number: waNumber,
            content_type: 'text',
            payload: {
              to:   `91${normalised}`,
              type: 'text',
              text: { body },
            },
          }),
        },
      );
      if (res.ok) return true;
      console.warn('[notify:whatsapp] MSG91 status', res.status);
    } catch (e) {
      console.warn('[notify:whatsapp] API send failed', e);
    }
  }

  return false;
}

// ── In-app notification icon map ──────────────────────────────────────────────

const IN_APP_ICON: Record<NotifEventType, string> = {
  payment_submitted:       '💳',
  payment_acknowledged:    '✅',
  payment_approved:        '🎉',
  payment_rejected:        '❌',
  cashback_earned:         '💰',
  new_payment_received:    '💰',
  order_placed:            '🛍️',
  order_confirmed:         '✅',
  order_shipped:           '🚚',
  order_delivered:         '📦',
  new_order_received:      '🛍️',
  offer_nearby:            '📍',
  campaign_sent:           '📣',
  account_created:         '🚀',
  login_alert:             '🔐',
  claim_invitation:        '🏢',
  lead_follow_up_reminder:  '📋',
  lead_stage_changed:       '🎯',
  lead_created:             '✨',
  lead_activity_logged:     '📝',
  lead_follow_up_scheduled: '📅',
  lead_follow_up_completed: '✅',
  lead_won:                 '🏆',
  lead_lost:                '❌',
};

// ── Write in-app notification to Supabase ─────────────────────────────────────

async function writeInAppNotification(
  recipientType: 'customer' | 'business',
  userId: string | undefined,
  type: NotifEventType,
  subject: string,
  body: string,
  data: NotifPayload['data'],
): Promise<boolean> {
  if (!supabase || !userId) return false;
  try {
    await supabase.from('in_app_notifications').insert({
      user_id:    userId,
      user_type:  recipientType,
      event_type: type,
      title:      subject,
      body:       body.slice(0, 500),
      icon:       IN_APP_ICON[type] ?? '🔔',
      is_read:    false,
      action_url: null,
      metadata: {
        amount:       data.amount,
        businessName: data.businessName,
        customerName: data.customerName,
        submissionId: data.submissionId,
        cashback:     data.cashback,
      },
    });
    return true;
  } catch (e) {
    console.warn('[notify:in_app] DB write failed', e);
    return false;
  }
}

// ── Log to Supabase ───────────────────────────────────────────────────────────

async function logNotification(
  recipientType: 'customer' | 'business',
  recipientId: string | undefined,
  type: NotifEventType,
  channel: NotifChannel,
  subject: string,
  body: string,
  success: boolean,
  recipientEmail?: string,
  recipientPhone?: string,
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('notification_logs').insert({
      recipient_type:  recipientType,
      recipient_id:    recipientId ?? null,
      event_type:      type,
      channel,
      subject,
      body:            body.slice(0, 1000),
      status:          success ? 'sent' : 'failed',
      recipient_email: recipientEmail ?? null,
      recipient_phone: recipientPhone ?? null,
    });
  } catch { /* non-critical */ }
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

export async function sendNotification(payload: NotifPayload): Promise<SendResult[]> {
  const { type, recipient, recipientType, userId, data, channels } = payload;
  const activeChannels: NotifChannel[] = channels ?? ['email', 'sms', 'whatsapp', 'in_app'];

  // Ask for confirmation before sending any external message
  const externalChannels = activeChannels.filter(c => c === 'email' || c === 'sms' || c === 'whatsapp');
  if (externalChannels.length > 0) {
    const channelLabel = externalChannels.join(' / ').toUpperCase();
    const preview = buildMessage(type, data, recipient.name, externalChannels[0]);
    const confirmed = window.confirm(
      `Send ${channelLabel} message to ${recipient.name}?\n\n"${preview.body.slice(0, 200)}${preview.body.length > 200 ? '…' : ''}"`
    );
    if (!confirmed) return [];
  }

  const results: SendResult[] = [];

  for (const channel of activeChannels) {
    const msg = buildMessage(type, data, recipient.name, channel);

    let success = false;
    let error: string | undefined;

    try {
      switch (channel) {
        case 'email':
          if (recipient.email) {
            success = await sendEmail(recipient.email, recipient.name, msg.subject, msg.body);
          } else {
            error = 'no email address';
          }
          break;

        case 'sms':
          if (recipient.phone) {
            success = await sendSMS(recipient.phone, msg.body);
          } else {
            error = 'no phone number';
          }
          break;

        case 'whatsapp':
          if (recipient.phone) {
            success = await sendWhatsApp(recipient.phone, msg.body);
          } else {
            error = 'no phone number';
          }
          break;

        case 'in_app':
          // Write row to in_app_notifications → triggers realtime subscription in notification pages
          success = await writeInAppNotification(
            recipientType,
            userId,
            type,
            msg.subject,
            msg.body,
            data,
          );
          break;

        case 'push':
          // Firebase Cloud Messaging — sends to the user's registered FCM token
          if (userId && supabase) {
            try {
              const { data: tokenRows } = await supabase
                .from('fcm_tokens')
                .select('token')
                .eq('user_id', userId)
                .eq('platform', 'web')
                .limit(1)
                .single();

              if (tokenRows?.token) {
                const { error: fnErr } = await supabase.functions.invoke('fcm-send', {
                  body: {
                    token: tokenRows.token,
                    title: msg.subject,
                    body:  msg.body,
                    data:  { url: '/', type, userId: userId ?? '' },
                  },
                });
                success = !fnErr;
                if (fnErr) error = fnErr.message;
              } else {
                error = 'no FCM token registered';
              }
            } catch (e) {
              error = String(e);
            }
          } else {
            error = 'no userId or supabase not configured';
          }
          break;
      }
    } catch (e) {
      error = String(e);
      success = false;
    }

    results.push({ channel, success, error });

    // Log every attempt
    await logNotification(
      recipientType,
      undefined,
      type,
      channel,
      msg.subject,
      msg.body,
      success,
      recipient.email,
      recipient.phone,
    );
  }

  return results;
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

/** Get current customer's contact info from localStorage */
export function getCustomerRecipient(): NotifRecipient {
  try {
    const u = JSON.parse(localStorage.getItem('user') ?? '{}');
    return {
      name:  u.name  ?? u.email?.split('@')[0] ?? 'Customer',
      email: u.email ?? undefined,
      phone: u.phone ?? undefined,
    };
  } catch {
    return { name: 'Customer' };
  }
}

/** Notify customer on payment submission */
export async function notifyPaymentSubmitted(params: {
  customer: NotifRecipient;
  customerId?: string;
  businessName: string;
  amount: number;
  method: string;
  cashback: number;
  submissionId: string;
}) {
  return sendNotification({
    type: 'payment_submitted',
    recipient: params.customer,
    recipientType: 'customer',
    userId: params.customerId,
    data: {
      businessName:   params.businessName,
      amount:         params.amount,
      method:         params.method,
      cashback:       params.cashback,
      submissionId:   params.submissionId,
    },
  });
}

/** Notify business owner of a new incoming payment */
export async function notifyBusinessNewPayment(params: {
  business: NotifRecipient;
  businessId?: string;
  customerName: string;
  amount: number;
  method: string;
  submissionId: string;
}) {
  return sendNotification({
    type: 'new_payment_received',
    recipient: params.business,
    recipientType: 'business',
    userId: params.businessId,
    data: {
      customerName:  params.customerName,
      amount:        params.amount,
      method:        params.method,
      submissionId:  params.submissionId,
    },
  });
}

/** Notify customer when business changes payment status */
export async function notifyPaymentStatusChange(params: {
  customer: NotifRecipient;
  customerId?: string;
  businessName: string;
  amount: number;
  cashback?: number;
  newStatus: 'acknowledged' | 'approved' | 'rejected';
}) {
  const typeMap: Record<string, NotifEventType> = {
    acknowledged: 'payment_acknowledged',
    approved:     'payment_approved',
    rejected:     'payment_rejected',
  };
  return sendNotification({
    type: typeMap[params.newStatus] as NotifEventType,
    recipient: params.customer,
    recipientType: 'customer',
    userId: params.customerId,
    data: {
      businessName: params.businessName,
      amount:       params.amount,
      cashback:     params.cashback,
      status:       params.newStatus,
    },
  });
}

/** Notify customer about an order */
export async function notifyOrderUpdate(params: {
  customer: NotifRecipient;
  customerId?: string;
  businessName: string;
  amount: number;
  status: 'placed' | 'confirmed' | 'shipped' | 'delivered';
  orderId?: string;
}) {
  const typeMap: Record<string, NotifEventType> = {
    placed:    'order_placed',
    confirmed: 'order_confirmed',
    shipped:   'order_shipped',
    delivered: 'order_delivered',
  };
  return sendNotification({
    type: typeMap[params.status] as NotifEventType,
    recipient: params.customer,
    recipientType: 'customer',
    userId: params.customerId,
    data: {
      businessName: params.businessName,
      amount:       params.amount,
      orderId:      params.orderId,
    },
  });
}

/** Notify business owner of a due lead follow-up */
export async function notifyLeadFollowUpDue(params: {
  business: NotifRecipient;
  businessId?: string;
  leadName: string;
  followUpTitle: string;
}) {
  return sendNotification({
    type: 'lead_follow_up_reminder',
    recipient: params.business,
    recipientType: 'business',
    userId: params.businessId,
    channels: ['in_app'],
    data: {
      leadName:      params.leadName,
      followUpTitle: params.followUpTitle,
    },
  });
}

/** Notify business owner when a lead stage changes */
export async function notifyLeadStageChanged(params: {
  business: NotifRecipient;
  businessId?: string;
  leadName: string;
  newStage: string;
}) {
  return sendNotification({
    type: 'lead_stage_changed',
    recipient: params.business,
    recipientType: 'business',
    userId: params.businessId,
    channels: ['in_app'],
    data: {
      leadName: params.leadName,
      newStage: params.newStage,
    },
  });
}

/**
 * Notify business (owner + team) about a lead action via in-app notification only.
 * Only the in_app channel is used — WhatsApp/SMS would be too noisy for every action.
 */
export async function notifyLeadAction(params: {
  businessId: string;
  eventType: NotifEventType;
  data: Record<string, string | number | undefined>;
  actorName?: string;
}): Promise<void> {
  if (!supabase) return;

  try {
    const { businessId, eventType, data, actorName } = params;
    const msg = buildMessage(eventType, data as NotifPayload['data'], 'Team', 'in_app');

    await supabase.from('in_app_notifications').insert({
      user_id:    businessId,
      user_type:  'business',
      event_type: eventType,
      title:      msg.subject,
      body:       msg.body.slice(0, 500),
      icon:       IN_APP_ICON[eventType] ?? '🔔',
      is_read:    false,
      action_url: null,
      metadata:   { ...data, actorName },
    });
  } catch (e) {
    console.warn('[notifyLeadAction]', e);
  }
}
