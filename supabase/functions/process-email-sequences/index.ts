// Deno edge function: Process email sequences (drip campaigns)
// Trigger: Daily cron job to send scheduled sequence emails

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface EmailSequence {
  id: string;
  business_id: string;
  campaign_id: string;
  sequence_name: string;
  trigger_type: string;
  step_number: number;
  step_delay_days: number;
  email_subject: string;
  email_body: string;
  is_active: boolean;
}

interface Lead {
  id: string;
  email: string;
  name: string;
  business_id: string;
  created_at: string;
}

async function sendEmailViaResend(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Redeem Rocket <noreply@redeemrocket.in>",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      console.error(`Resend error: ${response.statusText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

async function processSequences() {
  console.log("Starting email sequence processing...");

  try {
    // Get all active sequences
    const { data: sequences, error: seqError } = await supabase
      .from("email_sequences")
      .select("*")
      .eq("is_active", true);

    if (seqError) throw seqError;
    if (!sequences || sequences.length === 0) {
      console.log("No active sequences found");
      return { success: true, message: "No sequences to process" };
    }

    let emailsSent = 0;
    const now = new Date();

    // Process each sequence
    for (const seq of sequences) {
      const sequence = seq as EmailSequence;

      // Find leads eligible for this sequence step
      // Rule: Lead created N days ago + not already sent this email
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - sequence.step_delay_days);

      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("id, email, name, business_id, created_at")
        .eq("business_id", sequence.business_id)
        .lte("created_at", targetDate.toISOString())
        .gt("created_at", new Date(targetDate.getTime() - 86400000).toISOString()); // Within 24 hour window

      if (leadsError) {
        console.error(`Error fetching leads for sequence ${sequence.id}:`, leadsError);
        continue;
      }

      if (!leads || leads.length === 0) {
        console.log(`No eligible leads for sequence: ${sequence.sequence_name} step ${sequence.step_number}`);
        continue;
      }

      // Check if email already sent for this lead/sequence
      for (const lead of leads) {
        const leadData = lead as Lead;

        const { data: existingEmail } = await supabase
          .from("email_tracking")
          .select("id")
          .eq("campaign_id", sequence.campaign_id)
          .eq("recipient_email", leadData.email)
          .match({ event_type: "sent" })
          .limit(1);

        // Skip if already sent
        if (existingEmail && existingEmail.length > 0) {
          continue;
        }

        // Send email
        const emailHtml = sequence.email_body.replace(/{name}/g, leadData.name || "Customer").replace(/{business}/g, sequence.business_id);

        const sent = await sendEmailViaResend(leadData.email, sequence.email_subject, emailHtml);

        if (sent) {
          // Log email send in tracking table
          await supabase.from("email_tracking").insert({
            recipient_email: leadData.email,
            event_type: "sent",
            campaign_id: sequence.campaign_id,
            email_id: `seq-${sequence.id}-${leadData.id}`,
            event_time: new Date().toISOString(),
          });

          emailsSent++;
          console.log(`Sent sequence email to ${leadData.email} (${sequence.sequence_name} - Day ${sequence.step_delay_days})`);
        }
      }
    }

    console.log(`Sequence processing complete. Emails sent: ${emailsSent}`);
    return { success: true, emailsSent, message: `Processed sequences and sent ${emailsSent} emails` };
  } catch (err) {
    console.error("Sequence processing failed:", err);
    return { success: false, error: String(err) };
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  // Verify authorization (should be called by cron or authorized service)
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const result = await processSequences();
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
