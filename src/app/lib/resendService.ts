/**
 * resendService.ts
 * Client-side Resend email service for outreach, campaigns, and direct messaging
 *
 * Features:
 * - Bulk campaign emails with HTML templates
 * - Direct personal messages
 * - Bulk outreach with rate limiting
 * - Email tracking (opens, clicks, bounces)
 * - Unsubscribe management
 * - List segmentation
 *
 * Resend API: https://resend.com/docs
 * Deploy edge function: supabase functions deploy send-campaign-email
 * Required secrets:
 *   RESEND_API_KEY      — from resend.com
 *   RESEND_FROM         — verified sender (e.g., "App <noreply@yourdomain.com>")
 */

import { supabase } from './supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmailRecipient {
  email: string;
  name?: string;
  properties?: Record<string, string>;
}

export interface CampaignEmailPayload {
  recipients: EmailRecipient[];
  subject: string;
  template: 'campaign' | 'promotional' | 'newsletter' | 'announcement';
  content: string;
  htmlContent?: string;
  campaignId?: string;
  businessId: string;
  replyTo?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface DirectMessagePayload {
  to: EmailRecipient;
  subject: string;
  body: string;
  htmlBody?: string;
  businessId: string;
  channel: 'email' | 'whatsapp' | 'sms';
  toPhone?: string;
}

export interface BulkOutreachPayload {
  recipients: EmailRecipient[];
  subject: string;
  template: 'invitation' | 'introduction' | 'partnership' | 'feature_launch';
  content: string;
  htmlContent?: string;
  businessId: string;
  campaignName: string;
  batchSize?: number;
  delayMs?: number;
}

export interface EmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  accepted?: string[];
  rejected?: string[];
  failedCount?: number;
  successCount?: number;
}

export interface TrackingPixelUrl {
  campaignId: string;
  recipientEmail: string;
  trackingId: string;
}

// ── Env config ─────────────────────────────────────────────────────────────────

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const RESEND_FROM = import.meta.env.VITE_RESEND_FROM || 'Redeem Rocket <noreply@redeemrocket.in>';
const RESEND_REPLY_TO = import.meta.env.VITE_RESEND_REPLY_TO || 'support@redeemrocket.in';

// ── Email templates ─────────────────────────────────────────────────────────────

function generateTemplate(
  template: string,
  content: string,
  companyName = 'Redeem Rocket',
  logoUrl?: string,
): string {
  const baseColors = {
    primary: '#7c3aed',
    secondary: '#a855f7',
    accent: '#db2777',
    text: '#111827',
    muted: '#6b7280',
    light: '#f3f0ff',
  };

  const preheader = content.split('\n')[0].slice(0, 100);

  const templates: Record<string, string> = {
    campaign: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${preheader}</title>
</head>
<body style="margin:0;padding:0;background:${baseColors.light};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${baseColors.light};padding:40px 20px;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
        <!-- Header gradient -->
        <tr><td style="height:6px;background:linear-gradient(90deg,${baseColors.primary},${baseColors.secondary},${baseColors.accent});"></td></tr>

        <!-- Logo area -->
        <tr><td style="padding:32px 40px 20px;border-bottom:1px solid #f3f4f6;">
          <div style="font-size:18px;font-weight:700;color:${baseColors.primary};">${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height:40px;">` : companyName}</div>
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:36px 40px;">
          ${content.split('\n').map(line => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${baseColors.text};">${line}</p>`).join('')}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #f3f4f6;background:#fafafa;">
          <p style="margin:0;font-size:12px;color:${baseColors.muted};">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
          <p style="margin:8px 0 0;font-size:11px;color:${baseColors.muted};">
            <a href="[unsubscribe_url]" style="color:${baseColors.primary};text-decoration:none;">Unsubscribe</a> |
            <a href="[preference_url]" style="color:${baseColors.primary};text-decoration:none;">Manage preferences</a>
          </p>
        </td></tr>

        <!-- Bottom border -->
        <tr><td style="height:4px;background:linear-gradient(90deg,${baseColors.accent},${baseColors.secondary},${baseColors.primary});"></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,

    promotional: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr><td style="padding:40px;text-align:center;">
          <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${baseColors.primary};">🎉 Special Offer</h2>
          ${content.split('\n').map(line => `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${baseColors.text};">${line}</p>`).join('')}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,

    newsletter: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;">
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 24px;font-size:20px;font-weight:700;color:${baseColors.text};">Newsletter</h1>
          ${content.split('\n\n').map((section, i) => `<div style="margin:0 0 24px;${i > 0 ? 'border-top:1px solid #e5e7eb;padding-top:24px;' : ''}">${section.split('\n').map(line => `<p style="margin:0 0 12px;font-size:14px;color:${baseColors.text};">${line}</p>`).join('')}</div>`).join('')}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,

    announcement: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:linear-gradient(135deg,${baseColors.primary} 0%,${baseColors.secondary} 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:48px 40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">📢</div>
          <h1 style="margin:0 0 20px;font-size:28px;font-weight:800;color:${baseColors.primary};">Important Update</h1>
          ${content.split('\n').map(line => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${baseColors.text};">${line}</p>`).join('')}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  };

  return templates[template] || templates.campaign;
}

// ── Campaign email sending ────────────────────────────────────────────────────

export async function sendCampaignEmails(
  payload: CampaignEmailPayload,
): Promise<EmailResult> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    const htmlContent = payload.htmlContent || generateTemplate(
      payload.template,
      payload.content,
    );

    const result = await supabase.functions.invoke('send-campaign-email', {
      body: {
        recipients: payload.recipients,
        subject: payload.subject,
        htmlContent,
        content: payload.content,
        campaignId: payload.campaignId,
        businessId: payload.businessId,
        replyTo: payload.replyTo || RESEND_REPLY_TO,
        trackOpens: payload.trackOpens !== false,
        trackClicks: payload.trackClicks !== false,
      },
    });

    if (result.error) {
      console.error('[Resend] Campaign email error:', result.error);
      return { ok: false, error: result.error.message };
    }

    return {
      ok: result.data?.ok ?? false,
      messageId: result.data?.batchId,
      successCount: result.data?.successCount,
      failedCount: result.data?.failedCount,
      accepted: result.data?.accepted,
      rejected: result.data?.rejected,
    };
  } catch (err) {
    console.error('[Resend] sendCampaignEmails error:', err);
    return { ok: false, error: String(err) };
  }
}

// ── Direct message sending ────────────────────────────────────────────────────

export async function sendDirectMessage(
  payload: DirectMessagePayload,
): Promise<EmailResult> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    const result = await supabase.functions.invoke('send-direct-message', {
      body: {
        channel: payload.channel,
        to_email: payload.to.email,
        to_phone: payload.toPhone,
        to_name: payload.to.name,
        subject: payload.subject,
        body: payload.body,
        htmlBody: payload.htmlBody,
        businessId: payload.businessId,
      },
    });

    if (result.error) {
      console.error('[Resend] Direct message error:', result.error);
      return { ok: false, error: result.error.message };
    }

    return {
      ok: result.data?.ok ?? false,
      messageId: result.data?.messageId,
    };
  } catch (err) {
    console.error('[Resend] sendDirectMessage error:', err);
    return { ok: false, error: String(err) };
  }
}

// ── Bulk outreach sending ─────────────────────────────────────────────────────

export async function sendBulkOutreach(
  payload: BulkOutreachPayload,
): Promise<EmailResult> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    const htmlContent = payload.htmlContent || generateTemplate(
      'campaign',
      payload.content,
    );

    const result = await supabase.functions.invoke('bulk-outreach-email', {
      body: {
        recipients: payload.recipients,
        subject: payload.subject,
        htmlContent,
        content: payload.content,
        campaignName: payload.campaignName,
        businessId: payload.businessId,
        resendApiKey: RESEND_API_KEY,
        batchSize: payload.batchSize || 50,
        delayMs: payload.delayMs || 500,
      },
    });

    if (result.error) {
      console.error('[Resend] Bulk outreach error:', result.error);
      return { ok: false, error: result.error.message };
    }

    return {
      ok: result.data?.ok ?? false,
      successCount: result.data?.successCount,
      failedCount: result.data?.failedCount,
      accepted: result.data?.accepted,
      rejected: result.data?.rejected,
    };
  } catch (err) {
    console.error('[Resend] sendBulkOutreach error:', err);
    return { ok: false, error: String(err) };
  }
}

// ── Email list management ─────────────────────────────────────────────────────

export async function addToList(
  listId: string,
  contacts: EmailRecipient[],
  businessId: string,
): Promise<EmailResult> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    const result = await supabase.functions.invoke('manage-email-list', {
      body: {
        action: 'add',
        listId,
        contacts,
        businessId,
      },
    });

    return {
      ok: result.data?.ok ?? false,
      error: result.error?.message,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function removeFromList(
  listId: string,
  emails: string[],
  businessId: string,
): Promise<EmailResult> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    const result = await supabase.functions.invoke('manage-email-list', {
      body: {
        action: 'remove',
        listId,
        emails,
        businessId,
      },
    });

    return {
      ok: result.data?.ok ?? false,
      error: result.error?.message,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── Email tracking ────────────────────────────────────────────────────────────

export async function trackEmailOpen(
  campaignId: string,
  recipientEmail: string,
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('email_tracking')
      .insert({
        campaign_id: campaignId,
        recipient_email: recipientEmail,
        event_type: 'open',
        event_time: new Date().toISOString(),
      });

    return !error;
  } catch {
    return false;
  }
}

export async function trackEmailClick(
  campaignId: string,
  recipientEmail: string,
  linkUrl?: string,
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('email_tracking')
      .insert({
        campaign_id: campaignId,
        recipient_email: recipientEmail,
        event_type: 'click',
        link_url: linkUrl,
        event_time: new Date().toISOString(),
      });

    return !error;
  } catch {
    return false;
  }
}

export async function getCampaignStats(campaignId: string) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('email_tracking')
      .select('event_type')
      .eq('campaign_id', campaignId);

    if (error || !data) return null;

    const opens = data.filter(d => d.event_type === 'open').length;
    const clicks = data.filter(d => d.event_type === 'click').length;

    return { opens, clicks };
  } catch {
    return null;
  }
}
