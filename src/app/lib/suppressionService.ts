/**
 * suppressionService.ts
 * Email suppression list management
 *
 * Prevents sending emails to:
 * - Hard bounces (invalid addresses)
 * - Spam complaints
 * - Unsubscribed addresses
 *
 * Usage:
 * 1. Check if email is suppressed: await isEmailSuppressed(email)
 * 2. Filter recipients: const active = await filterActiveMails(recipients)
 * 3. Add manual suppression: await addSuppressionEntry(email, 'complaint', reason)
 */

import { supabase } from './supabase';

export interface SuppressionEntry {
  id?: string;
  email: string;
  suppression_type: 'bounce' | 'complaint' | 'unsubscribe';
  reason?: string;
  suppressed_at?: string;
}

// ── Suppression Checks ────────────────────────────────────────────────────────

/**
 * Check if an email is on the suppression list
 */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase
      .from('email_suppressions')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Get suppression details for an email
 */
export async function getSuppressionDetails(email: string): Promise<SuppressionEntry | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('email_suppressions')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    return error ? null : data;
  } catch {
    return null;
  }
}

/**
 * Check multiple emails and filter out suppressed ones
 */
export async function filterActiveMails(
  emails: string[],
): Promise<string[]> {
  if (!supabase || emails.length === 0) return emails;

  try {
    const lowerEmails = emails.map(e => e.toLowerCase());

    const { data: suppressedEmails, error } = await supabase
      .from('email_suppressions')
      .select('email')
      .in('email', lowerEmails);

    if (error || !suppressedEmails) return emails;

    const suppressedSet = new Set(suppressedEmails.map(s => s.email));
    return emails.filter(email => !suppressedSet.has(email.toLowerCase()));
  } catch {
    return emails;
  }
}

/**
 * Filter recipients objects (with email property)
 */
export async function filterActiveRecipients(
  recipients: Array<{ email: string; [key: string]: any }>,
): Promise<Array<{ email: string; [key: string]: any }>> {
  const activeEmails = await filterActiveMails(recipients.map(r => r.email));
  const activeSet = new Set(activeEmails.map(e => e.toLowerCase()));

  return recipients.filter(recipient =>
    activeSet.has(recipient.email.toLowerCase())
  );
}

// ── Suppression Management ────────────────────────────────────────────────────

/**
 * Add email to suppression list
 */
export async function addSuppressionEntry(
  email: string,
  suppressionType: 'bounce' | 'complaint' | 'unsubscribe',
  reason?: string,
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('email_suppressions')
      .insert({
        email: email.toLowerCase(),
        suppression_type: suppressionType,
        reason: reason || null,
      })
      .select();

    if (error) {
      // If email already exists, update it
      if (error.code === '23505') { // Unique constraint violation
        const { updateError } = await supabase
          .from('email_suppressions')
          .update({
            suppression_type: suppressionType,
            reason: reason || null,
            suppressed_at: new Date().toISOString(),
          })
          .eq('email', email.toLowerCase());

        return !updateError;
      }
      console.error('Error adding suppression entry:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error adding suppression entry:', err);
    return false;
  }
}

/**
 * Remove email from suppression list
 */
export async function removeSuppressionEntry(email: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('email_suppressions')
      .delete()
      .eq('email', email.toLowerCase());

    return !error;
  } catch {
    return false;
  }
}

/**
 * Get all suppressed emails for a business (via their campaigns)
 */
export async function getBusinessSuppressions(businessId: string): Promise<SuppressionEntry[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('email_suppressions')
      .select('*')
      .in('email',
        // Subquery: get all recipients from business campaigns
        supabase
          .from('email_tracking')
          .select('recipient_email')
          .eq('campaign_id',
            supabase
              .from('outreach_campaigns')
              .select('id')
              .eq('business_id', businessId)
          )
      );

    return error ? [] : (data || []);
  } catch {
    return [];
  }
}

/**
 * Get suppression statistics
 */
export async function getSuppressionStats(): Promise<{
  total_suppressed: number;
  bounces: number;
  complaints: number;
  unsubscribes: number;
} | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('email_suppressions')
      .select('suppression_type');

    if (error || !data) return null;

    return {
      total_suppressed: data.length,
      bounces: data.filter(d => d.suppression_type === 'bounce').length,
      complaints: data.filter(d => d.suppression_type === 'complaint').length,
      unsubscribes: data.filter(d => d.suppression_type === 'unsubscribe').length,
    };
  } catch {
    return null;
  }
}
